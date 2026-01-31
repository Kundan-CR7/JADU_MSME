import structlog

log = structlog.get_logger()

class SupplierRanker:
    def __init__(self, db_conn):
        self.db_conn = db_conn
        self.weights = self._load_weights()

    def _load_weights(self):
        try:
            cur = self.db_conn.cursor()
            cur.execute("SELECT rule_key, weight_value FROM scoring_rules")
            rows = cur.fetchall()
            cur.close()
            
            weights = {row[0]: float(row[1]) for row in rows}
            # Default fallback
            return {
                'price_weight': weights.get('price_weight', 0.4),
                'speed_weight': weights.get('speed_weight', 0.3),
                'reliability_weight': weights.get('reliability_weight', 0.3)
            }
        except Exception:
            return {'price_weight': 0.4, 'speed_weight': 0.3, 'reliability_weight': 0.3}

    def rank_suppliers(self, item_id: str, urgency: str = 'NORMAL'):
        """
        Rank suppliers for an item based on weights and urgency.
        """
        cur = self.db_conn.cursor()
        
        # Fetch suppliers who sell this item
        query = """
            SELECT s.id, s.name, s.reliability_score, si.price, si.lead_time_days
            FROM supplier_items si
            JOIN suppliers s ON si.supplier_id = s.id
            WHERE si.item_id = %s AND s.deleted_at IS NULL
        """
        cur.execute(query, (item_id,))
        suppliers = cur.fetchall()
        cur.close()

        if not suppliers:
            return []

        scored_suppliers = []
        
        # Adjust weights based on urgency
        w_price = self.weights['price_weight']
        w_speed = self.weights['speed_weight']
        w_rel = self.weights['reliability_weight']

        if urgency == 'URGENT':
            w_speed += 0.3
            w_rel += 0.1
            w_price = max(0, w_price - 0.4)
        
        # Normalize inputs for scoring (Simplified Min-Max normalization per batch is better, 
        # but for single pass we use inverse relationships)
        
        for s in suppliers:
            s_id, name, reliability, price, lead_time = s
            reliability = float(reliability)
            price = float(price)
            lead_time = int(lead_time)

            # Score Calculation (Higher is better)
            # Price Score: Lower price -> Higher score (Assume baseline 100 or relative)
            # Speed Score: Lower lead time -> Higher score
            
            # Simple inverse logic for demo:
            price_score = 100 / price if price > 0 else 0
            speed_score = 10 / lead_time if lead_time > 0 else 0
            
            final_score = (price_score * w_price) + (speed_score * w_speed) + (reliability * w_rel)
            
            scored_suppliers.append({
                "supplier_id": s_id,
                "name": name,
                "score": final_score,
                "details": {
                    "price": price,
                    "lead_time": lead_time,
                    "reliability": reliability
                }
            })

        # Sort descending
        scored_suppliers.sort(key=lambda x: x['score'], reverse=True)
        return scored_suppliers
