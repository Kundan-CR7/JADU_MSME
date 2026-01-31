import structlog
import json
from forecaster import Forecaster
from supplier_ranker import SupplierRanker

log = structlog.get_logger()

class DecisionEngine:
    def __init__(self, db_conn):
        self.db_conn = db_conn
        self.forecaster = Forecaster(db_conn)
        self.ranker = SupplierRanker(db_conn)

    def run_cycle(self, trigger_type, payload):
        """
        Main Agent Loop.
        trigger_type: 'SALE', 'CRON', 'MANUAL'
        payload: dict context
        """
        log.info("decision_engine_start", trigger=trigger_type)
        
        if trigger_type == 'SALE':
            self._handle_sale_trigger(payload)
        
        if trigger_type == 'CRON':
            self._check_bottlenecks()
            self._check_expiry()

    def _handle_sale_trigger(self, payload):
        invoice_id = payload.get('invoiceId')
        items = self._get_items_from_invoice(invoice_id)
        
        for item in items:
            self._evaluate_stock_health(item)

    def _check_bottlenecks(self):
        """
        Identify stuck tasks and logging reassign suggestions.
        """
        cur = self.db_conn.cursor()
        # Find tasks in TODO/IN_PROGRESS for > 2 days (Simulated by checking updated_at < ago-2d)
        query = """
            SELECT t.id, t.title, s.name, t.status
            FROM tasks t
            LEFT JOIN staff s ON t.assigned_to = s.id
            WHERE t.status IN ('TODO', 'IN_PROGRESS') 
            AND t.updated_at < NOW() - INTERVAL '2 days'
        """
        cur.execute(query)
        stuck_tasks = cur.fetchall()
        
        if stuck_tasks:
            log.info("bottlenecks_detected", count=len(stuck_tasks))
            for task in stuck_tasks:
                 task_id, title, staff_name, status = task
                 decision_text = f"Bottleneck: Task '{title}' is stuck in {status} for > 2 days. Suggested Action: Reassign from {staff_name or 'Unassigned'}."
                 context = {"task_id": task_id, "current_staff": staff_name}
                 self._log_decision("BOTTLENECK", None, decision_text, context)
        
        cur.close()

    def _check_expiry(self):
        """
        Check for batches expiring in next 7 days
        """
        cur = self.db_conn.cursor()
        query = """
            SELECT i.name, ib.quantity, ib.expiry_date
            FROM inventory_batches ib
            JOIN items i ON ib.item_id = i.id
            WHERE ib.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
            AND ib.quantity > 0
        """
        cur.execute(query)
        expiring = cur.fetchall()
        
        if expiring:
             for batch in expiring:
                 name, qty, date = batch
                 decision_text = f"Expiry Alert: {qty} units of {name} expiring on {date}. Suggestion: Discount or Bundle."
                 self._log_decision("EXPIRY", None, decision_text, {"item": name, "qty": qty})
        
        cur.close()

    def _evaluate_stock_health(self, item):
        item_id = item['item_id']
        current_stock = self._get_current_stock(item_id)
        
        daily_demand = self.forecaster.predict_demand(item_id)
        lead_time_buffer = 7
        required_stock = daily_demand * lead_time_buffer
        
        log.info("stock_evaluation", item=item['name'], current=current_stock, required=required_stock)

        if current_stock < required_stock:
            self._trigger_restock_suggestion(item, required_stock - current_stock)

    def _trigger_restock_suggestion(self, item, qty_needed):
        suppliers = self.ranker.rank_suppliers(item['item_id'])
        
        if not suppliers:
            self._log_decision("WARNING", item['item_id'], "No suppliers found for item. Please source a supplier.", {})
            return

        best_supplier = suppliers[0]
        
        decision_text = (
            f"Restock Suggestion: Order {int(qty_needed)} units of {item['name']} "
            f"from {best_supplier['name']}. "
            f"Score: {best_supplier['score']:.2f}"
        )
        
        context = {
            "qty_needed": qty_needed,
            "top_candidates": suppliers[:3]
        }

        self._log_decision("RESTOCK", item['item_id'], decision_text, context)

    def _log_decision(self, type, item_id, text, context):
        cur = self.db_conn.cursor()
        # Handle nullable item_id for non-item decisions
        query = """
            INSERT INTO agent_decision_logs (decision_type, related_item_id, decision_text, context)
            VALUES (%s, %s, %s, %s)
        """
        cur.execute(query, (type, item_id, text, json.dumps(context, default=str)))
        self.db_conn.commit()
        cur.close()
        log.info("decision_logged", type=type, text=text)

    # --- Helpers ---
    def _get_items_from_invoice(self, invoice_id):
        cur = self.db_conn.cursor()
        query = """
            SELECT i.id, i.name 
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN items i ON si.item_id = i.id
            WHERE s.invoice_id = %s
        """
        cur.execute(query, (invoice_id,))
        rows = cur.fetchall()
        cur.close()
        return [{'item_id': r[0], 'name': r[1]} for r in rows]

    def _get_current_stock(self, item_id):
        cur = self.db_conn.cursor()
        query = "SELECT SUM(quantity) FROM inventory_batches WHERE item_id = %s AND (expiry_date >= CURRENT_DATE OR expiry_date IS NULL)"
        cur.execute(query, (item_id,))
        res = cur.fetchone()
        cur.close()
        return res[0] if res and res[0] else 0
