import structlog
import json
from forecaster import Forecaster
from supplier_ranker import SupplierRanker
from sklearn.ensemble import IsolationForest   # ← new import
import numpy as np                             # ← new import

log = structlog.get_logger()

class DecisionEngine:
    def __init__(self, db_conn):
        self.db_conn = db_conn
        self.forecaster = Forecaster(db_conn)
        self.ranker = SupplierRanker(db_conn)

    # ... (run_cycle, _handle_sale_trigger, _evaluate_stock_health, etc. remain unchanged)

    def _check_bottlenecks(self):
        """
        Use Isolation Forest to detect anomalous (unusually long) task durations.
        Also keeps basic stuck-task check as fallback/safety net.
        """
        cur = self.db_conn.cursor()

        # ── Step 1: Get recent task durations (last 14 days for context)
        query_durations = """
            SELECT 
                t.id, 
                t.title, 
                s.name AS staff_name, 
                t.assigned_to,
                EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.started_at)) / 60 AS duration_minutes
            FROM tasks t
            LEFT JOIN staff s ON t.assigned_to = s.id
            WHERE t.started_at >= NOW() - INTERVAL '14 days'
              AND t.status IN ('COMPLETED', 'IN_PROGRESS')  -- include in-progress if partially timed
              AND EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.started_at)) IS NOT NULL
            ORDER BY t.started_at
        """
        cur.execute(query_durations)
        rows = cur.fetchall()

        if len(rows) < 10:
            log.warning("too_few_duration_data", count=len(rows), msg="Falling back to time-based bottleneck check")
            self._fallback_stuck_tasks_check(cur)
            cur.close()
            return

        # Prepare numpy array for Isolation Forest (single feature: duration_minutes)
        durations = np.array([[row[4]] for row in rows if row[4] is not None])  # duration_minutes

        if durations.shape[0] == 0:
            log.warning("no_valid_durations_found")
            self._fallback_stuck_tasks_check(cur)
            cur.close()
            return

        # ── Step 2: Fit Isolation Forest
        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.05,          # expected fraction of anomalies — tune this!
            random_state=42,
            max_samples=min(256, len(durations))  # good default
        )

        iso_forest.fit(durations)

        # Predict: -1 = anomaly (long duration), 1 = normal
        labels = iso_forest.predict(durations)

        # ── Step 3: Collect anomalous tasks
        anomalous_tasks = []
        for i, row in enumerate(rows):
            if labels[i] == -1:
                task_id, title, staff_name, assigned_to, duration_min = row
                anomalous_tasks.append({
                    "task_id": task_id,
                    "title": title,
                    "staff_name": staff_name or "Unassigned",
                    "duration_minutes": round(duration_min, 1),
                    "assigned_to": assigned_to
                })

        if anomalous_tasks:
            log.info("anomalous_durations_detected", count=len(anomalous_tasks))

            for anom in anomalous_tasks:
                decision_text = (
                    f"Bottleneck (anomaly): Task '{anom['title']}' took {anom['duration_minutes']} min "
                    f"– unusually long for current worker ({anom['staff_name']}). "
                    f"Suggested Action: Reassign pending tasks of this worker to faster staff."
                )
                context = {
                    "task_id": anom["task_id"],
                    "current_staff": anom["staff_name"],
                    "duration_minutes": anom["duration_minutes"],
                    "assigned_to": anom["assigned_to"]
                }
                self._log_decision("BOTTLENECK_DURATION_ANOMALY", None, decision_text, context)

        else:
            log.info("no_duration_anomalies_detected")

        # ── Optional: Keep original stuck check as secondary layer
        self._fallback_stuck_tasks_check(cur)

        cur.close()

    def _fallback_stuck_tasks_check(self, cur):
        """Original logic – keep as safety net"""
        query_stuck = """
            SELECT t.id, t.title, s.name, t.status
            FROM tasks t
            LEFT JOIN staff s ON t.assigned_to = s.id
            WHERE t.status IN ('TODO', 'IN_PROGRESS') 
            AND t.updated_at < NOW() - INTERVAL '2 days'
        """
        cur.execute(query_stuck)
        stuck_tasks = cur.fetchall()

        if stuck_tasks:
            log.info("stuck_tasks_detected", count=len(stuck_tasks))
            for task in stuck_tasks:
                task_id, title, staff_name, status = task
                decision_text = f"Stuck Task: '{title}' in {status} > 2 days. Reassign from {staff_name or 'Unassigned'}."
                context = {"task_id": task_id, "current_staff": staff_name}
                self._log_decision("BOTTLENECK_STUCK", None, decision_text, context)

    # ... rest of the class unchanged (_check_expiry, _log_decision, helpers ...)