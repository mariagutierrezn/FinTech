"""
Unusual Time Strategy - Detección de transacciones en horario inusual

Implementa HU-007: Detecta transacciones en horarios atípicos para el usuario

Cumplimiento SOLID:
- Single Responsibility: Solo evalúa patrones horarios
- Open/Closed: Implementa FraudStrategy sin modificarla
- Liskov Substitution: Puede sustituir a FraudStrategy
- Dependency Inversion: Depende de abstracción (FraudStrategy)
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, time
from collections import Counter
from .base import FraudStrategy
from ..models import Transaction, RiskLevel, Location


class UnusualTimeStrategy(FraudStrategy):
    """
    Estrategia que detecta transacciones en horarios inusuales
    
    Analiza el patrón horario del usuario y detecta transacciones
    que ocurren fuera de su rango horario habitual.
    
    Ejemplo: Si el usuario siempre opera entre 9am-6pm, una transacción
    a las 3am se marca como sospechosa.
    """

    def __init__(
        self, 
        repository: Any,
        min_transactions_for_pattern: int = 5,
        outlier_threshold_hours: int = 4
    ) -> None:
        """
        Inicializa la estrategia
        
        Args:
            repository: Repositorio para obtener historial de transacciones
            min_transactions_for_pattern: Mínimo de transacciones para establecer patrón
            outlier_threshold_hours: Horas de diferencia para considerar inusual
        
        Raises:
            ValueError: Si los parámetros son inválidos
        """
        if min_transactions_for_pattern <= 0:
            raise ValueError("Minimum transactions must be positive")
        if outlier_threshold_hours <= 0:
            raise ValueError("Outlier threshold must be positive")
        if repository is None:
            raise ValueError("Repository cannot be None")
            
        self.repository = repository
        self.min_transactions_for_pattern = min_transactions_for_pattern
        self.outlier_threshold_hours = outlier_threshold_hours

    def _get_user_transaction_hours(self, user_id: str) -> List[int]:
        """
        Obtiene las horas de transacciones previas del usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de horas (0-23) de transacciones previas
        """
        try:
            # Obtener historial del usuario
            evaluations = self.repository.get_evaluations_by_user(user_id)
            
            # Extraer hora de cada transacción
            hours = []
            for evaluation in evaluations:
                if hasattr(evaluation, 'timestamp') and evaluation.timestamp:
                    hours.append(evaluation.timestamp.hour)
            
            return hours
        except Exception as e:
            print(f"Error getting user transaction hours: {e}")
            return []

    def _is_within_normal_hours(self, hour: int, historical_hours: List[int]) -> bool:
        """
        Determina si una hora está dentro del patrón normal del usuario
        
        Args:
            hour: Hora a evaluar (0-23)
            historical_hours: Lista de horas históricas del usuario
            
        Returns:
            True si está dentro del patrón normal, False si es inusual
        """
        if not historical_hours:
            return True  # Sin historial, permitir
        
        # Contar frecuencia de cada hora
        hour_counts = Counter(historical_hours)
        
        # Calcular horas más frecuentes (patrón)
        if not hour_counts:
            return True
        
        # Si la hora actual tiene transacciones previas, considerarla normal
        if hour in hour_counts:
            return True
        
        # Verificar si está cerca de las horas frecuentes
        frequent_hours = [h for h, count in hour_counts.items() if count >= 2]
        
        if not frequent_hours:
            # Sin patrón claro, permitir
            return True
        
        # Verificar si está dentro del threshold de alguna hora frecuente
        for freq_hour in frequent_hours:
            # Calcular diferencia circular (considerando que 23->0)
            diff = min(abs(hour - freq_hour), 24 - abs(hour - freq_hour))
            if diff <= self.outlier_threshold_hours:
                return True
        
        return False

    async def evaluate(
        self, transaction: Transaction, historical_location: Optional[Location] = None
    ) -> Dict[str, Any]:
        """
        Evalúa si la transacción ocurre en un horario inusual
        
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
            # Obtener historial de horas del usuario
            historical_hours = self._get_user_transaction_hours(transaction.user_id)
            
            # Si no hay suficiente historial, no evaluar
            if len(historical_hours) < self.min_transactions_for_pattern:
                return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
            
            # Obtener hora de la transacción actual
            current_hour = transaction.timestamp.hour if transaction.timestamp else datetime.now().hour
            
            # Evaluar si está dentro del patrón
            if not self._is_within_normal_hours(current_hour, historical_hours):
                # Formatear hora en formato 12h
                am_pm = "AM" if current_hour < 12 else "PM"
                display_hour = current_hour if current_hour <= 12 else current_hour - 12
                if display_hour == 0:
                    display_hour = 12
                
                return {
                    "risk_level": RiskLevel.MEDIUM_RISK,
                    "reasons": ["unusual_transaction_time"],
                    "details": f"Transaction at unusual hour: {display_hour:02d}:00 {am_pm} (pattern based on {len(historical_hours)} previous transactions)",
                }
            
            return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
            
        except Exception as e:
            # En caso de error, no bloquear la transacción
            print(f"Error in UnusualTimeStrategy: {e}")
            return {"risk_level": RiskLevel.LOW_RISK, "reasons": [], "details": ""}
