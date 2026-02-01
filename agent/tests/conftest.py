import pytest
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import os

# Mock database connection for testing
@pytest.fixture
def mock_db_connection(mocker):
    """Mock PostgreSQL connection"""
    mock_conn = mocker.MagicMock()
    mock_cursor = mocker.MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn

@pytest.fixture
def test_db_connection():
    """
    Real database connection for integration tests.
    Uses environment variable DATABASE_URL or defaults to test database.
    """
    db_url = os.getenv("TEST_DATABASE_URL", os.getenv("DATABASE_URL"))
    if db_url:
        conn = psycopg2.connect(db_url)
        yield conn
        conn.close()
    else:
        pytest.skip("No test database configured")

@pytest.fixture
def sample_sales_data():
    """Sample sales data for testing forecaster"""
    base_date = datetime(2024, 1, 1)
    return [
        (base_date + timedelta(days=i), 10 + (i % 5))  # sale_date, total_qty
        for i in range(30)
    ]

@pytest.fixture
def sample_suppliers():
    """Sample supplier data for testing ranker"""
    return [
        {
            "id": "supplier-1",
            "name": "Fast Supplier",
            "reliability_score": 90.0,
            "price": 100.0,
            "lead_time_days": 2
        },
        {
            "id": "supplier-2",
            "name": "Cheap Supplier",
            "reliability_score": 70.0,
            "price": 80.0,
            "lead_time_days": 7
        },
        {
            "id": "supplier-3",
            "name": "Reliable Supplier",
            "reliability_score": 95.0,
            "price": 120.0,
            "lead_time_days": 5
        }
    ]

@pytest.fixture
def sample_items():
    """Sample inventory items"""
    return [
        {
            "id": "item-1",
            "name": "Brake Pads",
            "current_stock": 5,
            "reorder_point": 10,
            "cost_price": 50.0,
            "selling_price": 75.0
        },
        {
            "id": "item-2",
            "name": "Engine Oil",
            "current_stock": 50,
            "reorder_point": 20,
            "cost_price": 20.0,
            "selling_price": 35.0
        }
    ]

@pytest.fixture
def sample_tasks():
    """Sample task data"""
    return [
        {
            "id": "task-1",
            "title": "Restock Brake Pads",
            "status": "TODO",
            "assigned_to": "staff-1",
            "updated_at": datetime.now() - timedelta(days=3)
        },
        {
            "id": "task-2",
            "title": "Check Inventory",
            "status": "IN_PROGRESS",
            "assigned_to": "staff-2",
            "updated_at": datetime.now() - timedelta(hours=2)
        }
    ]

@pytest.fixture
def sample_purchase_history():
    """Sample purchase history for ML training"""
    return [
        {
            "supplier_id": "supplier-1",
            "item_id": "item-1",
            "price": 100.0,
            "lead_time_days": 2,
            "reliability_score": 90.0,
            "urgency_level": 8,
            "actual_delay_days": 0.5,
            "satisfaction_score": 95.0
        },
        {
            "supplier_id": "supplier-2",
            "item_id": "item-1",
            "price": 80.0,
            "lead_time_days": 7,
            "reliability_score": 70.0,
            "urgency_level": 5,
            "actual_delay_days": 2.0,
            "satisfaction_score": 70.0
        },
        # Add more samples for ML training
        *[
            {
                "supplier_id": f"supplier-{i % 3 + 1}",
                "item_id": "item-1",
                "price": 80.0 + (i * 5),
                "lead_time_days": 2 + (i % 5),
                "reliability_score": 70.0 + (i % 20),
                "urgency_level": 1 + (i % 10),
                "actual_delay_days": i % 3,
                "satisfaction_score": 60.0 + (i % 30)
            }
            for i in range(20)
        ]
    ]
