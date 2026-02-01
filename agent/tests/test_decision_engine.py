import pytest
from unittest.mock import MagicMock, patch, call
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from decision_engine import DecisionEngine


class TestDecisionEngine:
    """Test suite for decision engine module"""

    def test_decision_engine_initialization(self, mock_db_connection):
        """Test decision engine initializes correctly"""
        engine = DecisionEngine(mock_db_connection)
        
        assert engine.db_conn == mock_db_connection
        assert hasattr(engine, 'forecaster')
        assert hasattr(engine, 'ranker')

    def test_run_cycle(self, mock_db_connection):
        """Test main decision cycle executes"""
        engine = DecisionEngine(mock_db_connection)
        
        # Mock all internal methods
        with patch.object(engine, '_evaluate_stock_health') as mock_stock, \
             patch.object(engine, '_check_bottlenecks') as mock_bottleneck, \
             patch.object(engine, '_check_expiry') as mock_expiry:
            
            engine.run_cycle('TEST', {})
            
            # All checks should be called
            mock_stock.assert_called_once()
            mock_bottleneck.assert_called_once()
            mock_expiry.assert_called_once()

    def test_evaluate_stock_health_low_stock(self, mock_db_connection):
        """Test stock health evaluation detects low stock"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        # Mock low stock items
        mock_cursor.fetchall.return_value = [
            ('item-1', 'Brake Pads', 5, 10, 50.0, 75.0)  # Below reorder point
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        # Mock forecaster
        with patch.object(engine.forecaster, 'predict_demand', return_value=8.0), \
             patch.object(engine.ranker, 'rank_suppliers', return_value=[
                 {'supplier_id': 's1', 'name': 'Supplier A', 'score': 90}
             ]), \
             patch.object(engine, '_log_decision') as mock_log:
            
            engine._evaluate_stock_health()
            
            # Should log reorder decision
            assert mock_log.called

    def test_evaluate_stock_health_sufficient_stock(self, mock_db_connection):
        """Test stock health when stock is sufficient"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        # Mock no low stock items
        mock_cursor.fetchall.return_value = []
        mock_db_connection.cursor.return_value = mock_cursor
        
        with patch.object(engine, '_log_decision') as mock_log:
            engine._evaluate_stock_health()
            
            # Should not log any reorder decisions
            assert not mock_log.called

    def test_check_bottlenecks_with_anomalous_tasks(self, mock_db_connection):
        """Test bottleneck detection with anomalous task durations"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        
        # Mock task duration data (some anomalously long)
        mock_cursor.fetchall.return_value = [
            # Normal tasks (10-20 min)
            ('task-1', 'Task 1', 'Staff A', 'staff-1', 15.0),
            ('task-2', 'Task 2', 'Staff B', 'staff-2', 12.0),
            ('task-3', 'Task 3', 'Staff A', 'staff-1', 18.0),
            ('task-4', 'Task 4', 'Staff B', 'staff-2', 14.0),
            ('task-5', 'Task 5', 'Staff A', 'staff-1', 16.0),
            ('task-6', 'Task 6', 'Staff B', 'staff-2', 13.0),
            ('task-7', 'Task 7', 'Staff A', 'staff-1', 17.0),
            ('task-8', 'Task 8', 'Staff B', 'staff-2', 15.0),
            ('task-9', 'Task 9', 'Staff A', 'staff-1', 14.0),
            ('task-10', 'Task 10', 'Staff B', 'staff-2', 16.0),
            # Anomalous tasks (very long)
            ('task-11', 'Slow Task', 'Staff C', 'staff-3', 120.0),
            ('task-12', 'Another Slow', 'Staff C', 'staff-3', 150.0),
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        with patch.object(engine, '_log_decision') as mock_log, \
             patch.object(engine, '_fallback_stuck_tasks_check'):
            
            engine._check_bottlenecks()
            
            # Should detect anomalies and log
            assert mock_log.called

    def test_check_bottlenecks_insufficient_data(self, mock_db_connection):
        """Test bottleneck check with insufficient data (fallback)"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        # Less than 10 tasks
        mock_cursor.fetchall.return_value = [
            ('task-1', 'Task 1', 'Staff A', 'staff-1', 15.0)
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        with patch.object(engine, '_fallback_stuck_tasks_check') as mock_fallback:
            engine._check_bottlenecks()
            
            # Should call fallback
            mock_fallback.assert_called_once()

    def test_fallback_stuck_tasks_check(self, mock_db_connection):
        """Test fallback stuck task detection"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        # Mock stuck tasks (>2 days old)
        mock_cursor.fetchall.return_value = [
            ('task-1', 'Old Task', 'Staff A', 'TODO')
        ]
        
        with patch.object(engine, '_log_decision') as mock_log:
            engine._fallback_stuck_tasks_check(mock_cursor)
            
            # Should log stuck task
            assert mock_log.called
            call_args = mock_log.call_args[0]
            assert call_args[0] == 'BOTTLENECK_STUCK'

    def test_check_expiry_with_expiring_items(self, mock_db_connection):
        """Test expiry check detects items expiring soon"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        # Mock items expiring within 7 days
        expiry_date = datetime.now() + timedelta(days=5)
        mock_cursor.fetchall.return_value = [
            ('batch-1', 'item-1', 'Engine Oil', 10, expiry_date)
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        with patch.object(engine, '_log_decision') as mock_log:
            engine._check_expiry()
            
            # Should log expiry warning
            assert mock_log.called
            call_args = mock_log.call_args[0]
            assert call_args[0] == 'EXPIRY_WARNING'

    def test_check_expiry_no_expiring_items(self, mock_db_connection):
        """Test expiry check when no items are expiring soon"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_db_connection.cursor.return_value = mock_cursor
        
        with patch.object(engine, '_log_decision') as mock_log:
            engine._check_expiry()
            
            # Should not log anything
            assert not mock_log.called

    def test_log_decision(self, mock_db_connection):
        """Test decision logging to database"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_db_connection.cursor.return_value = mock_cursor
        
        engine._log_decision(
            'REORDER',
            'item-1',
            'Recommend reordering Brake Pads',
            {'quantity': 50}
        )
        
        # Should execute INSERT query
        assert mock_cursor.execute.called
        call_args = mock_cursor.execute.call_args[0]
        assert 'INSERT INTO agent_decision_logs' in call_args[0]

    def test_handle_sale_trigger(self, mock_db_connection):
        """Test handling of sale trigger events"""
        engine = DecisionEngine(mock_db_connection)
        
        payload = {
            'invoice_id': 'INV-12345',
            'items': [
                {'item_id': 'item-1', 'quantity': 10}
            ]
        }
        
        with patch.object(engine, '_evaluate_stock_health') as mock_stock:
            engine._handle_sale_trigger(payload)
            
            # Should re-evaluate stock after sale
            mock_stock.assert_called_once()

    def test_urgency_calculation_critical(self, mock_db_connection):
        """Test urgency level calculation for critical stock"""
        engine = DecisionEngine(mock_db_connection)
        
        # Stock at 0, very critical
        urgency = engine._calculate_urgency(
            current_stock=0,
            reorder_point=10,
            predicted_demand=5.0
        )
        
        assert urgency == 'URGENT'

    def test_urgency_calculation_normal(self, mock_db_connection):
        """Test urgency level for normal stock situation"""
        engine = DecisionEngine(mock_db_connection)
        
        # Stock above reorder point
        urgency = engine._calculate_urgency(
            current_stock=15,
            reorder_point=10,
            predicted_demand=3.0
        )
        
        assert urgency == 'NORMAL'

    def test_decision_engine_error_handling(self, mock_db_connection):
        """Test decision engine handles errors gracefully"""
        engine = DecisionEngine(mock_db_connection)
        
        # Mock database error
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = Exception("Database error")
        mock_db_connection.cursor.return_value = mock_cursor
        
        # Should not raise exception
        try:
            engine._evaluate_stock_health()
        except Exception as e:
            pytest.fail(f"Decision engine should handle errors gracefully, but raised: {e}")


class TestDecisionEngineIntegration:
    """Integration tests for decision engine"""

    def test_full_cycle_execution(self, mock_db_connection):
        """Test complete decision cycle from start to finish"""
        engine = DecisionEngine(mock_db_connection)
        
        mock_cursor = MagicMock()
        # Setup mock data for all checks
        mock_cursor.fetchall.side_effect = [
            # Low stock items
            [('item-1', 'Product', 5, 10, 50.0, 75.0)],
            # Task durations (for bottleneck check)
            [('task-1', 'Task', 'Staff', 'staff-1', 15.0)] * 5,
            # Stuck tasks
            [],
            # Expiring items
            []
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        with patch.object(engine.forecaster, 'predict_demand', return_value=8.0), \
             patch.object(engine.ranker, 'rank_suppliers', return_value=[]):
            
            # Should complete without errors
            engine.run_cycle('SCHEDULED', {})


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=decision_engine'])
