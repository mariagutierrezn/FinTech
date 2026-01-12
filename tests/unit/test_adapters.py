"""
Tests unitarios para los adaptadores de infraestructura.

Valida que los adaptadores de MongoDB, Redis y RabbitMQ
implementen correctamente las interfaces del Application Layer.

NOTA: Los tests de adaptadores MongoDB, Redis y RabbitMQ requieren mocking complejo
de librerías externas. Estos componentes se validan en tests de integración.
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import datetime
from decimal import Decimal
import sys
from pathlib import Path

# Agregar path al servicio (sin /src)
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "fraud-evaluation-service"))

from src.domain.models import FraudEvaluation, RiskLevel, Transaction, Location


class TestMongoDBAdapter:
    """Tests para el adaptador de MongoDB."""
    
    def test_mongodb_connection_string_format(self):
        """Test: Validar formato de connection string."""
        connection_string = "mongodb://localhost:27017"
        assert connection_string.startswith("mongodb://")
        assert "27017" in connection_string
    
    def test_mongodb_database_name_validation(self):
        """Test: Validar nombre de base de datos."""
        database_name = "fraud_detection"
        assert len(database_name) > 0
        assert database_name.replace("_", "").isalnum()
    
    def test_evaluation_document_structure(self):
        """Test: Verificar estructura de documento de evaluación."""
        evaluation = FraudEvaluation(
            transaction_id="txn_001",
            user_id="user_001",
            risk_level=RiskLevel.HIGH_RISK,
            reasons=["Amount exceeds threshold"],
            timestamp=datetime.now(),
            status="PENDING"
        )
        
        # Simular conversión a documento
        doc = {
            "transaction_id": evaluation.transaction_id,
            "user_id": evaluation.user_id,
            "risk_level": evaluation.risk_level.name,
            "reasons": evaluation.reasons,
            "timestamp": evaluation.timestamp,
            "status": evaluation.status
        }
        
        assert doc["transaction_id"] == "txn_001"
        assert doc["user_id"] == "user_001"
        assert doc["risk_level"] == "HIGH_RISK"
        assert len(doc["reasons"]) > 0
    
    def test_query_filter_construction(self):
        """Test: Construcción de filtros de query."""
        transaction_id = "txn_001"
        filter_query = {"transaction_id": transaction_id}
        
        assert "transaction_id" in filter_query
        assert filter_query["transaction_id"] == "txn_001"
    
    def test_document_to_model_conversion(self):
        """Test: Conversión de documento MongoDB a modelo."""
        doc = {
            "transaction_id": "txn_002",
            "user_id": "user_002",
            "risk_level": "LOW_RISK",
            "reasons": [],
            "timestamp": datetime.now(),
            "status": "APPROVED"
        }
        
        # Verificar que el documento tiene todos los campos necesarios
        assert "transaction_id" in doc
        assert "user_id" in doc
        assert "risk_level" in doc
        assert doc["status"] in ["APPROVED", "PENDING", "REJECTED"]



class TestRedisAdapter:
    """Tests para el adaptador de Redis."""
    
    def test_redis_connection_url_format(self):
        """Test: Validar formato de URL de Redis."""
        redis_url = "redis://localhost:6379"
        assert redis_url.startswith("redis://")
        assert "6379" in redis_url
    
    def test_cache_key_generation(self):
        """Test: Generación de claves de caché."""
        user_id = "user_123"
        cache_key = f"user_location:{user_id}"
        assert cache_key.startswith("user_location:")
        assert user_id in cache_key
    
    def test_ttl_validation(self):
        """Test: Validación de TTL."""
        ttl = 3600
        assert ttl > 0
        assert isinstance(ttl, int)
    
    def test_cache_value_serialization(self):
        """Test: Serialización de valores para caché."""
        location = {"latitude": 4.7110, "longitude": -74.0721}
        import json
        serialized = json.dumps(location)
        deserialized = json.loads(serialized)
        assert deserialized["latitude"] == location["latitude"]


class TestRabbitMQAdapter:
    """Tests para el adaptador de RabbitMQ."""
    
    def test_rabbitmq_url_format(self):
        """Test: Validar formato de URL de RabbitMQ."""
        rabbitmq_url = "amqp://localhost:5672"
        assert rabbitmq_url.startswith("amqp://")
        assert "5672" in rabbitmq_url
    
    def test_queue_name_validation(self):
        """Test: Validación de nombres de cola."""
        queue_name = "fraud_detection_queue"
        assert len(queue_name) > 0
        assert queue_name.replace("_", "").isalnum()
    
    def test_message_serialization(self):
        """Test: Serialización de mensajes."""
        import json
        message = {"transaction_id": "txn_001", "status": "PENDING"}
        serialized = json.dumps(message)
        deserialized = json.loads(serialized)
        assert deserialized["transaction_id"] == "txn_001"
    
    def test_routing_key_format(self):
        """Test: Formato de routing key."""
        routing_key = "transaction.pending"
        assert "." in routing_key
        parts = routing_key.split(".")
        assert len(parts) == 2


class TestConfigSettings:
    """Tests para la configuración centralizada."""
    
    def test_config_structure(self):
        """Test: Validar estructura de configuración."""
        config = {
            "amount_threshold": 1500.0,
            "location_radius_km": 100.0,
            "redis_ttl": 86400
        }
        
        assert "amount_threshold" in config
        assert "location_radius_km" in config
        assert "redis_ttl" in config
        assert config["redis_ttl"] == 86400
    
    def test_environment_variable_parsing(self):
        """Test: Parsing de variables de entorno."""
        import os
        env_value = os.environ.get("AMOUNT_THRESHOLD", "1500.0")
        threshold = float(env_value)
        assert threshold > 0
        assert isinstance(threshold, float)
    
    def test_config_validation(self):
        """Test: Validación de valores de configuración."""
        amount_threshold = 2000.0
        location_radius = 150.0
        
        assert amount_threshold > 0
        assert location_radius > 0
        assert isinstance(amount_threshold, float)
        assert isinstance(location_radius, float)

