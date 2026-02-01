# Agent Test Suite

This directory contains comprehensive tests for the Python AI agent service.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and test configuration
├── test_forecaster.py       # Demand forecasting tests
├── test_supplier_ranker.py  # Supplier ranking tests
├── test_decision_engine.py  # Decision engine tests
└── test_main.py            # FastAPI endpoint tests
```

## Running Tests

### Install Test Dependencies

```bash
cd /Users/kundan/JADU_MSME/agent
pip install -r requirements-test.txt
```

### Run All Tests

```bash
pytest tests/ -v
```

### Run Specific Test File

```bash
pytest tests/test_forecaster.py -v
pytest tests/test_supplier_ranker.py -v
pytest tests/test_decision_engine.py -v
pytest tests/test_main.py -v
```

### Run with Coverage

```bash
pytest tests/ --cov=. --cov-report=html --cov-report=term
```

This will generate:
- Terminal coverage report
- HTML report in `htmlcov/index.html`

### Run Specific Test

```bash
pytest tests/test_forecaster.py::TestForecaster::test_predict_demand_with_sufficient_data -v
```

## Test Coverage

The test suite covers:

### 1. Forecaster Module (`forecaster.py`)
- ✅ Demand prediction with sufficient data
- ✅ Fallback with insufficient data
- ✅ Prophet model training
- ✅ Simple average fallback
- ✅ Error handling
- ✅ Seasonality detection
- ✅ Negative demand clamping

### 2. Supplier Ranker Module (`supplier_ranker.py`)
- ✅ ML model training
- ✅ Ranking with trained model
- ✅ Rule-based fallback
- ✅ Urgency level handling (NORMAL vs URGENT)
- ✅ No suppliers found scenario
- ✅ Missing data handling
- ✅ Score calculation consistency

### 3. Decision Engine Module (`decision_engine.py`)
- ✅ Stock health evaluation
- ✅ Low stock detection
- ✅ Bottleneck detection (Isolation Forest)
- ✅ Stuck task detection (fallback)
- ✅ Expiry date warnings
- ✅ Decision logging
- ✅ Urgency calculation
- ✅ Error handling
- ✅ Full cycle execution

### 4. FastAPI Endpoints (`main.py`)
- ✅ Root endpoint status
- ✅ Manual agent trigger
- ✅ Background task execution
- ✅ Request validation
- ✅ Database connection management
- ✅ Scheduled job execution
- ✅ Concurrent requests
- ✅ Error handling

## Mock Data

Tests use shared fixtures from `conftest.py`:
- `mock_db_connection` - Mock PostgreSQL connection
- `sample_sales_data` - Historical sales for forecasting
- `sample_suppliers` - Supplier data for ranking
- `sample_items` - Inventory items
- `sample_tasks` - Task data for bottleneck detection
- `sample_purchase_history` - Historical purchases for ML training

## Environment Variables

For integration tests with real database:

```bash
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5433/test_db"
```

If not set, integration tests will be skipped.

## Continuous Integration

Add to CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Python Agent Tests
  run: |
    cd agent
    pip install -r requirements.txt -r requirements-test.txt
    pytest tests/ --cov=. --cov-report=xml
```

## Debugging Tests

Run with verbose output and stop on first failure:

```bash
pytest tests/ -vv -x
```

Run with print statements visible:

```bash
pytest tests/ -v -s
```

## Expected Coverage

Target: **>85% code coverage**

Current modules coverage goals:
- `forecaster.py`: >90%
- `supplier_ranker.py`: >90%
- `decision_engine.py`: >85%
- `main.py`: >80%

## Notes

- Tests use `pytest-mock` for mocking database connections
- Prophet model tests may be slower due to ML training
- FastAPI tests use `TestClient` for synchronous testing
- Background tasks tested via mocking
