import pytest
import pandas as pd
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from forecaster import Forecaster


class TestForecaster:
    """Test suite for demand forecasting module"""

    def test_forecaster_initialization(self, mock_db_connection):
        """Test forecaster initializes correctly"""
        forecaster = Forecaster(mock_db_connection)
        assert forecaster.db_conn == mock_db_connection
        assert forecaster.model_cache == {}

    def test_predict_demand_with_sufficient_data(self, mock_db_connection, sample_sales_data):
        """Test demand prediction with sufficient historical data"""
        forecaster = Forecaster(mock_db_connection)
        
        # Mock database query to return sample data
        mock_cursor = MagicMock()
        mock_db_connection.cursor.return_value = mock_cursor
        
        # Create DataFrame for pd.read_sql mock
        df = pd.DataFrame(sample_sales_data, columns=['sale_date', 'total_qty'])
        
        with patch('pandas.read_sql', return_value=df):
            result = forecaster.predict_demand('test-item-id', forecast_days=7)
            
            # Should return a positive float
            assert isinstance(result, float)
            assert result >= 0.0

    def test_predict_demand_with_insufficient_data(self, mock_db_connection):
        """Test fallback when insufficient data is available"""
        forecaster = Forecaster(mock_db_connection)
        
        # Mock empty DataFrame (less than 10 rows)
        df = pd.DataFrame([], columns=['sale_date', 'total_qty'])
        
        with patch('pandas.read_sql', return_value=df):
            result = forecaster.predict_demand('test-item-id', forecast_days=7)
            
            # Should fallback to simple average
            assert isinstance(result, float)
            assert result >= 0.0

    def test_predict_demand_no_data(self, mock_db_connection):
        """Test prediction with no historical data"""
        forecaster = Forecaster(mock_db_connection)
        
        # Mock empty DataFrame
        df = pd.DataFrame([], columns=['sale_date', 'total_qty'])
        
        with patch('pandas.read_sql', return_value=df):
            result = forecaster.predict_demand('non-existent-item', forecast_days=7)
            
            # Should return 0.0 for no data
            assert result == 0.0

    def test_simple_average_fallback(self, mock_db_connection):
        """Test simple average fallback calculation"""
        forecaster = Forecaster(mock_db_connection)
        
        # Mock cursor to return average value
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [15.5]  # avg_daily
        mock_db_connection.cursor.return_value = mock_cursor
        
        result = forecaster._simple_average_fallback('test-item-id')
        
        assert result == 15.5
        assert mock_cursor.execute.called

    def test_simple_average_fallback_no_data(self, mock_db_connection):
        """Test fallback when no data exists for averaging"""
        forecaster = Forecaster(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [None]  # No data
        mock_db_connection.cursor.return_value = mock_cursor
        
        result = forecaster._simple_average_fallback('test-item-id')
        
        assert result == 0.0

    def test_predict_demand_with_custom_forecast_days(self, mock_db_connection, sample_sales_data):
        """Test prediction with custom forecast period"""
        forecaster = Forecaster(mock_db_connection)
        
        df = pd.DataFrame(sample_sales_data, columns=['sale_date', 'total_qty'])
        
        with patch('pandas.read_sql', return_value=df):
            result_7 = forecaster.predict_demand('test-item', forecast_days=7)
            result_30 = forecaster.predict_demand('test-item', forecast_days=30)
            
            # Both should return valid predictions
            assert isinstance(result_7, float)
            assert isinstance(result_30, float)
            assert result_7 >= 0.0
            assert result_30 >= 0.0

    def test_predict_demand_error_handling(self, mock_db_connection):
        """Test error handling in forecaster"""
        forecaster = Forecaster(mock_db_connection)
        
        # Mock database error
        with patch('pandas.read_sql', side_effect=Exception("Database error")):
            result = forecaster.predict_demand('test-item', forecast_days=7)
            
            # Should fallback gracefully
            assert isinstance(result, float)
            assert result >= 0.0

    def test_negative_demand_clamping(self, mock_db_connection, sample_sales_data):
        """Test that negative predictions are clamped to 0"""
        forecaster = Forecaster(mock_db_connection)
        
        # Create data that might result in negative prediction
        df = pd.DataFrame([
            (datetime(2024, 1, i), max(0, 20 - i * 2))  # Declining sales
            for i in range(1, 31)
        ], columns=['sale_date', 'total_qty'])
        
        with patch('pandas.read_sql', return_value=df):
            result = forecaster.predict_demand('test-item', forecast_days=7)
            
            # Should never be negative
            assert result >= 0.0


class TestForecasterIntegration:
    """Integration tests with real Prophet model"""

    def test_prophet_model_training(self, mock_db_connection):
        """Test that Prophet model trains successfully"""
        forecaster = Forecaster(mock_db_connection)
        
        # Create realistic sales data
        dates = pd.date_range(start='2024-01-01', end='2024-03-31', freq='D')
        sales = [10 + i % 7 + (i // 7) % 3 for i in range(len(dates))]  # Weekly pattern
        df = pd.DataFrame({'sale_date': dates, 'total_qty': sales})
        
        with patch('pandas.read_sql', return_value=df):
            result = forecaster.predict_demand('test-item', forecast_days=14)
            
            # Should produce reasonable forecast
            assert 0 < result < 100  # Reasonable range
            assert isinstance(result, float)

    def test_seasonality_detection(self, mock_db_connection):
        """Test that forecaster detects weekly seasonality"""
        forecaster = Forecaster(mock_db_connection)
        
        # Create data with strong weekly pattern
        dates = pd.date_range(start='2024-01-01', periods=90, freq='D')
        # High sales on weekends (5, 6), low on weekdays
        sales = [20 if i % 7 in [5, 6] else 5 for i in range(len(dates))]
        df = pd.DataFrame({'sale_date': dates, 'total_qty': sales})
        
        with patch('pandas.read_sql', return_value=df):
            result = forecaster.predict_demand('test-item', forecast_days=7)
            
            # Should predict average around the pattern
            assert result > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=forecaster'])
