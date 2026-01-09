"""
Infrastructure Configuration - Settings para Fraud Evaluation Service

Cumple Single Responsibility: Solo gestiona configuración
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configuración de la aplicación desde variables de entorno
    
    Usa Pydantic para validación automática y valores por defecto
    """

    # Service
    service_name: str = "fraud-evaluation-service"
    service_port: int = 8001

    # MongoDB
    mongodb_url: str = "mongodb://admin:fraud2026@localhost:27017"
    mongodb_database: str = "fraud_detection"

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 86400  # 24 horas

    # RabbitMQ
    rabbitmq_url: str = "amqp://fraud:fraud2026@localhost:5672"
    rabbitmq_transactions_queue: str = "transactions"
    rabbitmq_manual_review_queue: str = "manual_review"

    # Fraud Rules
    amount_threshold: float = 1500.0
    location_radius_km: float = 100.0
    
    # Rapid Transaction Detection (HU-006)
    rapid_tx_limit: int = 3  # Máximo de transacciones
    rapid_tx_window: int = 300  # Ventana de tiempo en segundos (5 minutos)
    
    # Unusual Time Detection (HU-007)
    min_transactions_for_time_pattern: int = 5  # Mínimo de transacciones para establecer patrón
    unusual_time_threshold_hours: int = 4  # Diferencia en horas para considerar inusual

    class Config:
        env_file = ".env"
        case_sensitive = False


# Singleton instance
settings = Settings()
