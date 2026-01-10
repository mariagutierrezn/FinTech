"""
UnusualTimeStrategy - Detecta transacciones en horarios inusuales.
HU-007: Como sistema, quiero detectar si una transacción se realiza en un horario
inusual para el usuario basándome en sus patrones históricos.
"""
from datetime import datetime, timedelta
from typing import Dict, Any
from collections import defaultdict

from .base import FraudStrategy
from src.domain.models import Transaction, RiskLevel


class UnusualTimeStrategy(FraudStrategy):
    """
    Estrategia que detecta transacciones en horarios inusuales basándose en
    el patrón histórico del usuario.
    
    Analiza el historial de transacciones del usuario en MongoDB para determinar
    sus horarios habituales de transacción y detecta desviaciones significativas.
    """
    
    def __init__(
        self,
        audit_repository,
        min_transactions_for_pattern: int = 10,
        unusual_threshold_hours: int = 3
    ):
        """
        Inicializa la estrategia con el repositorio de auditoría y parámetros.
        
        Args:
            audit_repository: Repositorio para acceder al historial de transacciones
            min_transactions_for_pattern: Número mínimo de transacciones para establecer un patrón
            unusual_threshold_hours: Diferencia en horas para considerar horario inusual
        """
        self.audit_repository = audit_repository
        self.min_transactions_for_pattern = min_transactions_for_pattern
        self.unusual_threshold_hours = unusual_threshold_hours
    
    def get_name(self) -> str:
        """Retorna el nombre de la estrategia."""
        return "unusual_time"
    
    def evaluate(self, transaction: Transaction, context: Dict[str, Any]) -> RiskLevel:
        """
        Evalúa si la transacción ocurre en un horario inusual para el usuario.
        
        Args:
            transaction: La transacción a evaluar
            context: Contexto adicional de evaluación
            
        Returns:
            RiskLevel: ALTO si es muy inusual, MEDIO si es moderadamente inusual, BAJO en caso contrario
        """
        try:
            user_id = transaction.user_id
            current_hour = transaction.timestamp.hour
            
            # Obtener historial de transacciones del usuario
            historical_transactions = self._get_user_transaction_history(user_id)
            
            # Si no hay suficientes transacciones históricas, no se puede establecer un patrón
            if len(historical_transactions) < self.min_transactions_for_pattern:
                return RiskLevel.LOW
            
            # Analizar patrón de horarios
            hourly_pattern = self._analyze_hourly_pattern(historical_transactions)
            
            # Verificar si el horario actual es inusual
            is_unusual, deviation_hours = self._is_unusual_hour(
                current_hour,
                hourly_pattern
            )
            
            # Evaluar riesgo según la desviación
            if is_unusual:
                if deviation_hours >= self.unusual_threshold_hours * 2:
                    return RiskLevel.HIGH
                elif deviation_hours >= self.unusual_threshold_hours:
                    return RiskLevel.MEDIUM
            
            return RiskLevel.LOW
            
        except Exception as e:
            # En caso de error, retornar riesgo bajo para no bloquear
            print(f"Error en UnusualTimeStrategy: {e}")
            return RiskLevel.LOW
    
    def get_reason(self, transaction: Transaction, risk_level: RiskLevel) -> str:
        """
        Retorna la razón del nivel de riesgo asignado.
        
        Args:
            transaction: La transacción evaluada
            risk_level: El nivel de riesgo asignado
            
        Returns:
            str: Descripción del motivo del riesgo
        """
        current_hour = transaction.timestamp.hour
        
        if risk_level == RiskLevel.HIGH:
            return (
                f"Transacción a las {current_hour}:00 es muy inusual "
                f"según el patrón histórico del usuario"
            )
        elif risk_level == RiskLevel.MEDIUM:
            return (
                f"Transacción a las {current_hour}:00 es moderadamente inusual "
                f"según el patrón histórico del usuario"
            )
        else:
            return "Horario de transacción dentro del patrón normal del usuario"
    
    def _get_user_transaction_history(self, user_id: str) -> list:
        """
        Obtiene el historial de transacciones del usuario desde MongoDB.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            list: Lista de transacciones históricas
        """
        try:
            # Obtener últimas 100 transacciones del usuario (últimos 90 días)
            cutoff_date = datetime.now() - timedelta(days=90)
            
            historical_data = self.audit_repository.find_by_user(
                user_id=user_id,
                limit=100,
                start_date=cutoff_date
            )
            
            return historical_data
            
        except Exception as e:
            print(f"Error obteniendo historial: {e}")
            return []
    
    def _analyze_hourly_pattern(self, transactions: list) -> Dict[int, int]:
        """
        Analiza el patrón de horarios de transacciones.
        
        Args:
            transactions: Lista de transacciones históricas
            
        Returns:
            Dict[int, int]: Diccionario con la frecuencia de transacciones por hora
        """
        hourly_counts = defaultdict(int)
        
        for tx in transactions:
            try:
                # Obtener hora de la transacción
                if isinstance(tx, dict):
                    timestamp = tx.get('timestamp')
                    if isinstance(timestamp, str):
                        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    hour = timestamp.hour
                else:
                    hour = tx.timestamp.hour
                
                hourly_counts[hour] += 1
                
            except Exception as e:
                continue
        
        return dict(hourly_counts)
    
    def _is_unusual_hour(
        self,
        current_hour: int,
        hourly_pattern: Dict[int, int]
    ) -> tuple[bool, int]:
        """
        Determina si la hora actual es inusual según el patrón.
        
        Args:
            current_hour: Hora actual de la transacción
            hourly_pattern: Patrón de horarios del usuario
            
        Returns:
            tuple[bool, int]: (es_inusual, horas_de_desviación)
        """
        if not hourly_pattern:
            return False, 0
        
        # Si el usuario nunca ha transaccionado a esta hora
        if current_hour not in hourly_pattern:
            # Encontrar la hora más cercana con transacciones
            min_deviation = 24
            for hour in hourly_pattern.keys():
                deviation = min(
                    abs(current_hour - hour),
                    24 - abs(current_hour - hour)
                )
                min_deviation = min(min_deviation, deviation)
            
            return min_deviation >= self.unusual_threshold_hours, min_deviation
        
        # Si ha transaccionado a esta hora, verificar frecuencia
        total_transactions = sum(hourly_pattern.values())
        hour_frequency = hourly_pattern[current_hour] / total_transactions
        
        # Si menos del 5% de transacciones son a esta hora, es inusual
        if hour_frequency < 0.05:
            # Calcular desviación aproximada
            most_common_hour = max(hourly_pattern, key=hourly_pattern.get)
            deviation = min(
                abs(current_hour - most_common_hour),
                24 - abs(current_hour - most_common_hour)
            )
            return deviation >= self.unusual_threshold_hours, deviation
        
        return False, 0

