"""
Rapid Transaction Strategy - Detección de transacciones en cadena

Implementa HU-006: Detecta múltiples transacciones del mismo usuario en corto tiempo

Cumplimiento SOLID:
- Single Responsibility: Solo evalúa patrones de transacciones rápidas
- Open/Closed: Implementa FraudStrategy sin modificarla
- Liskov Substitution: Puede sustituir a FraudStrategy
- Dependency Inversion: Depende de abstracción (FraudStrategy)
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from .base import FraudStrategy
from ..models import Transaction, RiskLevel, Location


class RapidTransactionStrategy(FraudStrategy):
    """
    Estrategia que detecta múltiples transacciones en corto tiempo
    
    Si un usuario realiza más de N transacciones en M minutos,
    las transacciones subsecuentes se marcan como sospechosas.
    
    Por defecto: más de 3 transacciones en 5 minutos
    """

    def __init__(
        self, 
        cache_service: Any,
        transaction_limit: int = 3, 
        time_window_seconds: int = 300
    ) -> None:
        """
        Inicializa la estrategia
        
        Args:
            cache_service: Servicio de cache (Redis) para tracking temporal
            transaction_limit: Número máximo de transacciones permitidas
            time_window_seconds: Ventana de tiempo en segundos (default: 300 = 5 minutos)
        
        Raises:
            ValueError: Si los parámetros son inválidos
        """
        if transaction_limit <= 0:
            raise ValueError("Transaction limit must be positive")
        if time_window_seconds <= 0:
            raise ValueError("Time window must be positive")
        if cache_service is None:
            raise ValueError("Cache service cannot be None")
            
        self.cache_service = cache_service
        self.transaction_limit = transaction_limit
        self.time_window_seconds = time_window_seconds

    async def evaluate(
        self, transaction: Transaction, historical_location: Optional[Location] = None
    ) -> Dict[str, Any]:
        """
        Evalúa si el usuario está realizando transacciones muy rápido
        
        Args:
            transaction: Transacción a evaluar
            historical_location: No usado en esta estrategia
        
        Returns:
            Dict con risk_level, reasons y details
        
        Raises:
            ValueError: Si transaction es None
        """
        if transaction is None:
            raise ValueError("Transaction cannot be None")

        try:
            # Clave en Redis para trackear transacciones del usuario
            cache_key = f"rapid_tx:{transaction.user_id}"
            
            # Obtener contador actual y timestamp de la primera transacción
            cached_data = await self.cache_service.get(cache_key)
            
            current_time = datetime.now()
            
            if cached_data is None:
                # Primera transacción del usuario en la ventana de tiempo
                await self.cache_service.set(
                    cache_key, 
                    {"count": 1, "first_tx_time": current_time.isoformat()},
                    ttl=self.time_window_seconds
                )
                return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
            
            # Parsear datos del cache
            tx_count = cached_data.get("count", 0)
            first_tx_time_str = cached_data.get("first_tx_time")
            
            if first_tx_time_str:
                first_tx_time = datetime.fromisoformat(first_tx_time_str)
                time_elapsed = (current_time - first_tx_time).total_seconds()
                
                # Si pasó la ventana de tiempo, reiniciar contador
                if time_elapsed > self.time_window_seconds:
                    await self.cache_service.set(
                        cache_key,
                        {"count": 1, "first_tx_time": current_time.isoformat()},
                        ttl=self.time_window_seconds
                    )
                    return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
            
            # Incrementar contador
            new_count = tx_count + 1
            await self.cache_service.set(
                cache_key,
                {"count": new_count, "first_tx_time": first_tx_time_str},
                ttl=self.time_window_seconds
            )
            
            # Evaluar si excede el límite
            if new_count > self.transaction_limit:
                time_window_minutes = self.time_window_seconds // 60
                return {
                    "risk_level": RiskLevel.MEDIUM_RISK,
                    "reasons": ["rapid_transaction_pattern"],
                    "details": f"User performed {new_count} transactions in {time_window_minutes} minutes (limit: {self.transaction_limit})",
                }
            
            return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
            
        except Exception as e:
            # En caso de error con Redis, no bloquear la transacción
            print(f"Error in RapidTransactionStrategy: {e}")
            return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
