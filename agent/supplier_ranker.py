import structlog

log = structlog.get_logger()

class SupplierRanker:
    def __init__(self, db_conn):
        self.db_conn = db_conn

    def rank_suppliers(self, item_id: str):
        log.info("ranking_suppliers", item_id=item_id)
        # Return dummy for now
        return [
            {"name": "Dummy Supplier A", "score": 85.5},
            {"name": "Dummy Supplier B", "score": 78.0}
        ]