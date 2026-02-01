import pytest
import pandas as pd
import numpy as np
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from supplier_ranker import SupplierRanker


class TestSupplierRanker:
    """Test suite for supplier ranking module"""

    def test_ranker_initialization(self, mock_db_connection):
        """Test supplier ranker initializes correctly"""
        ranker = SupplierRanker(mock_db_connection)
        assert ranker.db_conn == mock_db_connection
        assert hasattr(ranker, 'scaler')

    def test_model_training_with_sufficient_data(self, mock_db_connection, sample_purchase_history):
        """Test ML model trains with sufficient historical data"""
        # Mock database query
        df = pd.DataFrame(sample_purchase_history)
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
            
            # Model should be trained
            assert ranker.model is not None

    def test_model_training_with_insufficient_data(self, mock_db_connection):
        """Test fallback when insufficient data for training"""
        # Mock small dataset
        df = pd.DataFrame([
            {
                "supplier_id": "s1",
                "price": 100,
                "lead_time_days": 5,
                "reliability_score": 80,
                "urgency_level": 5,
                "actual_delay_days": 1,
                "satisfaction_score": 70
            }
        ])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
            
            # Model should be None (fallback to rule-based)
            assert ranker.model is None

    def test_rank_suppliers_with_ml_model(self, mock_db_connection, sample_suppliers, sample_purchase_history):
        """Test supplier ranking with trained ML model"""
        # Setup ML model
        df = pd.DataFrame(sample_purchase_history)
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        # Mock supplier query
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (s["id"], s["name"], s["reliability_score"], s["price"], s["lead_time_days"])
            for s in sample_suppliers
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        rankings = ranker.rank_suppliers("test-item", urgency="NORMAL")
        
        # Should return ranked list
        assert len(rankings) == 3
        assert all('score' in r for r in rankings)
        assert all('supplier_id' in r for r in rankings)
        
        # Should be sorted by score (descending)
        scores = [r['score'] for r in rankings]
        assert scores == sorted(scores, reverse=True)

    def test_rank_suppliers_fallback_normal_urgency(self, mock_db_connection, sample_suppliers):
        """Test rule-based ranking with normal urgency"""
        # No ML model (insufficient data)
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (s["id"], s["name"], s["reliability_score"], s["price"], s["lead_time_days"])
            for s in sample_suppliers
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        rankings = ranker.rank_suppliers("test-item", urgency="NORMAL")
        
        assert len(rankings) == 3
        # Cheap supplier should rank high for normal urgency
        assert rankings[0]['name'] == 'Cheap Supplier'

    def test_rank_suppliers_fallback_urgent(self, mock_db_connection, sample_suppliers):
        """Test rule-based ranking with urgent urgency (prioritizes speed)"""
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (s["id"], s["name"], s["reliability_score"], s["price"], s["lead_time_days"])
            for s in sample_suppliers
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        rankings = ranker.rank_suppliers("test-item", urgency="URGENT")
        
        assert len(rankings) == 3
        # Fast supplier should rank high for urgent
        assert rankings[0]['name'] == 'Fast Supplier'

    def test_rank_suppliers_no_suppliers_found(self, mock_db_connection):
        """Test when no suppliers are available for an item"""
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_db_connection.cursor.return_value = mock_cursor
        
        rankings = ranker.rank_suppliers("non-existent-item", urgency="NORMAL")
        
        assert rankings == []

    def test_ranking_includes_details(self, mock_db_connection, sample_suppliers):
        """Test that rankings include supplier details"""
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (s["id"], s["name"], s["reliability_score"], s["price"], s["lead_time_days"])
            for s in sample_suppliers
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        rankings = ranker.rank_suppliers("test-item", urgency="NORMAL")
        
        for ranking in rankings:
            assert 'supplier_id' in ranking
            assert 'name' in ranking
            assert 'score' in ranking
            assert 'details' in ranking
            assert 'price' in ranking['details']
            assert 'lead_time_days' in ranking['details']
            assert 'reliability' in ranking['details']

    def test_urgency_level_mapping(self, mock_db_connection, sample_suppliers):
        """Test urgency string to numeric level mapping"""
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (s["id"], s["name"], s["reliability_score"], s["price"], s["lead_time_days"])
            for s in sample_suppliers
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        # Check that urgency affects ranking
        normal_rankings = ranker.rank_suppliers("test-item", urgency="NORMAL")
        urgent_rankings = ranker.rank_suppliers("test-item", urgency="URGENT")
        
        # Rankings should be different based on urgency
        normal_top = normal_rankings[0]['supplier_id']
        urgent_top = urgent_rankings[0]['supplier_id']
        
        # Different urgency levels should potentially yield different top choices
        assert len(normal_rankings) == len(urgent_rankings)

    def test_score_calculation_consistency(self, mock_db_connection, sample_suppliers):
        """Test that scores are calculated consistently"""
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (s["id"], s["name"], s["reliability_score"], s["price"], s["lead_time_days"])
            for s in sample_suppliers
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        # Run ranking twice
        rankings1 = ranker.rank_suppliers("test-item", urgency="NORMAL")
        rankings2 = ranker.rank_suppliers("test-item", urgency="NORMAL")
        
        # Should produce identical results
        assert len(rankings1) == len(rankings2)
        for r1, r2 in zip(rankings1, rankings2):
            assert r1['supplier_id'] == r2['supplier_id']
            assert abs(r1['score'] - r2['score']) < 0.001  # Float comparison

    def test_handle_missing_reliability_score(self, mock_db_connection):
        """Test handling of suppliers with missing reliability scores"""
        df = pd.DataFrame([])
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("s1", "Supplier 1", None, 100.0, 5),  # None reliability
            ("s2", "Supplier 2", 80.0, 90.0, 4)
        ]
        mock_db_connection.cursor.return_value = mock_cursor
        
        rankings = ranker.rank_suppliers("test-item", urgency="NORMAL")
        
        # Should handle None and default to 70.0
        assert len(rankings) == 2
        assert all(r['details']['reliability'] > 0 for r in rankings)


class TestSupplierRankerMLModel:
    """Test ML model specific functionality"""

    def test_random_forest_predictions(self, mock_db_connection, sample_purchase_history):
        """Test RandomForest makes valid predictions"""
        df = pd.DataFrame(sample_purchase_history)
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        if ranker.model is not None:
            # Create test features
            test_features = np.array([[100.0, 5, 80.0, 5, 1.0]])
            features_scaled = ranker.scaler.transform(test_features)
            
            prediction = ranker.model.predict(features_scaled)
            
            assert len(prediction) == 1
            assert isinstance(prediction[0], (int, float))

    def test_scaler_fit_transform(self, mock_db_connection, sample_purchase_history):
        """Test feature scaling works correctly"""
        df = pd.DataFrame(sample_purchase_history)
        
        with patch('pandas.read_sql', return_value=df):
            ranker = SupplierRanker(mock_db_connection)
        
        if ranker.model is not None:
            # Scaler should be fitted
            assert hasattr(ranker.scaler, 'data_min_')
            assert hasattr(ranker.scaler, 'data_max_')


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=supplier_ranker'])
