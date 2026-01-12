"""
FastAPI - Aplicación principal
Configuración de la API y dependency injection

HUMAN REVIEW (María Gutiérrez):
La IA quería poner todas las conexiones (MongoDB, Redis, etc.) como variables globales.
Eso funciona, pero hace imposible probar el código y cambiar configuraciones en runtime.
Por eso las puse en funciones separadas que se pueden inyectar - así los tests usan mocks
y el código real usa las conexiones reales. Es más trabajo inicial pero vale la pena.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from decimal import Decimal
from api_gateway.routes import router
from src.adapters import (
    MongoDBAdapter,
    RedisAdapter,
    RabbitMQAdapter,
)
from src.config import settings
from src.domain.strategies.amount_threshold import AmountThresholdStrategy
from src.domain.strategies.location_check import LocationStrategy
from src.application.use_cases import (
    EvaluateTransactionUseCase,
    ReviewTransactionUseCase,
)

# Crear aplicación FastAPI
app = FastAPI(
    title="Fraud Detection Engine",
    description="Motor de detección de fraude con Clean Architecture",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency Injection
def get_repository():
    """Factory para TransactionRepository"""
    return MongoDBAdapter(settings.mongodb_url, settings.mongodb_database)


def get_cache():
    """Factory para CacheService"""
    return RedisAdapter(settings.redis_url, settings.redis_ttl)


def get_publisher():
    """Factory para MessagePublisher"""
    return RabbitMQAdapter(settings.rabbitmq_url)


def get_strategies():
    """
    Factory para estrategias de fraude
    
    Nota:
    La IA sugirió hardcodear las estrategias. Las cargo dinámicamente
    desde configuración para permitir modificación sin redespliegue (HU-008).
    """
    # Usar configuración por defecto de settings
    # NOTA: En producción se puede cargar desde Redis de forma asíncrona
    amount_threshold = Decimal(str(settings.amount_threshold))
    location_radius = settings.location_radius_km

    return [
        AmountThresholdStrategy(threshold=amount_threshold),
        LocationStrategy(radius_km=location_radius),
    ]


def get_evaluate_use_case(
    repository=Depends(get_repository),
    publisher=Depends(get_publisher),
    cache=Depends(get_cache),
):
    """Factory para EvaluateTransactionUseCase"""
    strategies = get_strategies()
    return EvaluateTransactionUseCase(repository, publisher, cache, strategies)


def get_review_use_case(repository=Depends(get_repository)):
    """Factory para ReviewTransactionUseCase"""
    return ReviewTransactionUseCase(repository)


# Registrar rutas con dependency injection
from api_gateway.routes import router, api_v1_router, configure_dependencies

configure_dependencies(
    repository_factory=get_repository,
    cache_factory=get_cache,
    evaluate_use_case_factory=get_evaluate_use_case,
    review_use_case_factory=get_review_use_case,
    publisher_factory=get_publisher
)

app.include_router(router)
app.include_router(api_v1_router)  # Añadir router v1


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
