import pandas as pd
import structlog
from datetime import timedelta

log = structlog.get_logger()

class Forecaster:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def predict_demand(self, item_id: str) -> float:
        """
        Predict daily demand for an item based on last 15 days sales.
        """
        try:
            # Fetch last 30 days sales for this item
            query = """
                SELECT created_at, quantity 
                FROM sale_items 
                JOIN sales ON sale_items.sale_id = sales.id
                WHERE item_id = %s AND created_at >= NOW() - INTERVAL '30 days'
            """
            
            df = pd.read_sql(query, self.db_conn, params=(item_id,))
            
            if df.empty:
                return 0.0

            # Simple Moving Average (Last 15 days)
            # In real world, we would do resampling (daily) then mean
            # df.set_index('created_at').resample('D').sum().mean()
            
            total_qty = df['quantity'].sum()
            days_active = 30 # Simplified
            
            daily_avg = total_qty / days_active
            
            # Basic Seasonality/Trend placeholder
            # predicted = daily_avg * 1.1 (Growth)
            
            log.info("demand_predicted", item_id=item_id, prediction=daily_avg)
            return float(daily_avg)

        except Exception as e:
            log.error("forecasting_error", error=str(e))
            return 0.0
