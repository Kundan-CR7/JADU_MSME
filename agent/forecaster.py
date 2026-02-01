import structlog
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
from typing import Optional

log = structlog.get_logger()

class Forecaster:
    def __init__(self, db_conn):
        self.db_conn = db_conn
        self.model_cache = {}  # Optional: cache models per item to avoid retraining every time

    def predict_demand(self, item_id: str, forecast_days: int = 7) -> float:
        """
        Predict average daily demand for the next 'forecast_days' using Prophet.
        Returns: predicted average daily demand (float)
        """
        try:
            # Fetch historical sales (daily aggregated would be ideal)
            query = """
                SELECT DATE(s.created_at) AS sale_date, SUM(si.quantity) AS total_qty
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE si.item_id = %s
                  AND s.created_at >= NOW() - INTERVAL '90 days'
                GROUP BY DATE(s.created_at)
                ORDER BY sale_date
            """
            df = pd.read_sql(query, self.db_conn, params=(item_id,))

            if df.empty or len(df) < 10:
                log.warning("Insufficient sales data for Prophet", item_id=item_id, rows=len(df))
                # Fallback: simple average or zero
                return self._simple_average_fallback(item_id)

            # Prophet requires 'ds' (datetime) and 'y' (value)
            df = df.rename(columns={'sale_date': 'ds', 'total_qty': 'y'})
            df['ds'] = pd.to_datetime(df['ds'])

            # Fill missing dates with 0 sales (important for seasonality)
            date_range = pd.date_range(start=df['ds'].min(), end=df['ds'].max(), freq='D')
            df_full = pd.DataFrame({'ds': date_range})
            df = df_full.merge(df, on='ds', how='left').fillna({'y': 0})

            # Optional: add Indian holidays (example)
            holidays = pd.DataFrame({
                'holiday': 'diwali',
                'ds': pd.to_datetime(['2025-10-20', '2026-11-08']),  # Update with real dates
                'lower_window': 0,
                'upper_window': 1,
            })

            # Train Prophet
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                holidays=holidays if 'holidays' in locals() else None,
                seasonality_mode='multiplicative'  # Good for sales with spikes
            )
            model.fit(df)

            # Forecast next 'forecast_days'
            future = model.make_future_dataframe(periods=forecast_days)
            forecast = model.predict(future)

            # Average predicted demand over next forecast_days
            future_forecast = forecast.tail(forecast_days)
            predicted_avg_daily = future_forecast['yhat'].mean()

            log.info(
                "prophet_forecast_success",
                item_id=item_id,
                historical_days=len(df),
                predicted_avg=predicted_avg_daily,
                forecast_days=forecast_days
            )

            return max(0.0, float(predicted_avg_daily))  # No negative demand

        except Exception as e:
            log.error("prophet_forecast_failed", item_id=item_id, error=str(e))
            return self._simple_average_fallback(item_id)

    def _simple_average_fallback(self, item_id: str) -> float:
        """Fallback when Prophet can't run (few data points, errors, etc.)"""
        try:
            query = """
                SELECT AVG(quantity) AS avg_daily
                FROM (
                    SELECT DATE(s.created_at) AS sale_date, SUM(si.quantity) AS quantity
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE si.item_id = %s
                    GROUP BY DATE(s.created_at)
                ) sub
            """
            cur = self.db_conn.cursor()
            cur.execute(query, (item_id,))
            result = cur.fetchone()
            cur.close()
            avg = float(result[0]) if result and result[0] else 0.0
            log.info("using_fallback_average", item_id=item_id, avg=avg)
            return avg
        except Exception:
            return 0.0