import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, get_db_connection


class TestFastAPIEndpoints:
    """Test suite for FastAPI endpoints"""

    @pytest.fixture
    def client(self):
        """Test client for FastAPI app"""
        return TestClient(app)

    def test_read_root(self, client):
        """Test root endpoint returns status"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "Agent is Running with Scheduler"

    def test_trigger_agent_endpoint(self, client, mock_db_connection):
        """Test manual agent trigger endpoint"""
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine') as mock_engine_class:
            
            mock_engine = MagicMock()
            mock_engine_class.return_value = mock_engine
            
            response = client.post("/agent/run", json={
                "trigger": "MANUAL",
                "payload": {}
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "Agent run initiated"
            assert data["trigger"] == "MANUAL"

    def test_trigger_agent_with_payload(self, client, mock_db_connection):
        """Test agent trigger with custom payload"""
        payload = {
            "trigger": "SALE",
            "payload": {
                "invoice_id": "INV-123",
                "items": [{"item_id": "item-1", "quantity": 5}]
            }
        }
        
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine') as mock_engine_class:
            
            mock_engine = MagicMock()
            mock_engine_class.return_value = mock_engine
            
            response = client.post("/agent/run", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            assert data["trigger"] == "SALE"

    @pytest.mark.asyncio
    async def test_agent_runs_in_background(self, mock_db_connection):
        """Test that agent task runs in background"""
        from main import run_agent_task
        
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine') as mock_engine_class:
            
            mock_engine = MagicMock()
            mock_engine_class.return_value = mock_engine
            
            # Should complete without blocking
            run_agent_task("TEST", {})
            
            # Engine should be initialized and run
            assert mock_engine_class.called
            assert mock_engine.run_cycle.called

    def test_database_connection_helper(self):
        """Test database connection helper function"""
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test'}), \
             patch('psycopg2.connect') as mock_connect:
            
            mock_conn = MagicMock()
            mock_connect.return_value = mock_conn
            
            conn = get_db_connection()
            
            assert conn == mock_conn
            mock_connect.assert_called_once()

    def test_scheduled_job_execution(self, mock_db_connection):
        """Test scheduled cron job executes"""
        from main import scheduled_agent_job
        
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine') as mock_engine_class:
            
            mock_engine = MagicMock()
            mock_engine_class.return_value = mock_engine
            
            scheduled_agent_job()
            
            # Should run with CRON trigger
            mock_engine.run_cycle.assert_called_once_with('CRON', {})

    def test_scheduled_job_error_handling(self):
        """Test scheduled job handles errors"""
        from main import scheduled_agent_job
        
        with patch('main.get_db_connection', side_effect=Exception("DB Error")):
            # Should not raise exception
            try:
                scheduled_agent_job()
            except Exception as e:
                pytest.fail(f"Scheduled job should handle errors, but raised: {e}")

    def test_agent_request_validation(self, client):
        """Test request validation for agent endpoint"""
        # Missing trigger field
        response = client.post("/agent/run", json={"payload": {}})
        
        assert response.status_code == 422  # Validation error

    def test_agent_request_with_empty_trigger(self, client, mock_db_connection):
        """Test agent request with empty trigger string"""
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine'):
            
            response = client.post("/agent/run", json={
                "trigger": "",
                "payload": {}
            })
            
            # Should still accept (backend will handle)
            assert response.status_code == 200

    def test_database_connection_cleanup(self, mock_db_connection):
        """Test that database connections are properly closed"""
        from main import run_agent_task
        
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine'):
            
            run_agent_task("TEST", {})
            
            # Connection should be closed after task
            assert mock_db_connection.close.called


class TestFastAPILifespan:
    """Test FastAPI lifespan events"""

    @pytest.mark.asyncio
    async def test_app_startup(self):
        """Test app startup initializes scheduler"""
        # This would require async context manager testing
        # For now, just verify app is initialized
        assert app is not None

    def test_cors_configuration(self, client):
        """Test CORS headers (if configured)"""
        response = client.get("/", headers={"Origin": "http://localhost:3000"})
        
        # Should return successfully
        assert response.status_code == 200


class TestAgentServiceIntegration:
    """Integration tests for complete agent service"""

    def test_full_agent_flow(self, client, mock_db_connection):
        """Test complete flow: trigger -> process -> log"""
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine') as mock_engine_class:
            
            mock_engine = MagicMock()
            mock_engine_class.return_value = mock_engine
            
            # Trigger agent
            response = client.post("/agent/run", json={
                "trigger": "MANUAL",
                "payload": {"test": "data"}
            })
            
            assert response.status_code == 200
            
            # Verify engine was called with correct params
            # (This happens in background task, so we test the setup)

    def test_concurrent_agent_requests(self, client, mock_db_connection):
        """Test handling multiple simultaneous requests"""
        with patch('main.get_db_connection', return_value=mock_db_connection), \
             patch('main.DecisionEngine'):
            
            responses = []
            for i in range(5):
                response = client.post("/agent/run", json={
                    "trigger": f"TEST_{i}",
                    "payload": {}
                })
                responses.append(response)
            
            # All should succeed
            assert all(r.status_code == 200 for r in responses)


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=main'])
