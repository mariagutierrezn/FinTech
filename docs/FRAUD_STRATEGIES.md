# 🛡️ Estrategias de Detección de Fraude - Implementación

## Resumen

Este documento describe las **5 estrategias de detección de fraude** implementadas en el Fraud Detection Engine, cumpliendo con las Historias de Usuario HU-003 a HU-007.

---

## Arquitectura

Todas las estrategias siguen el patrón **Strategy** (GoF Design Pattern) e implementan la interfaz `FraudStrategy`:

```python
class FraudStrategy(ABC):
    @abstractmethod
    async def evaluate(
        self, 
        transaction: Transaction, 
        historical_location: Optional[Location] = None
    ) -> Dict[str, Any]:
        pass
```

### Beneficios del Patrón Strategy:
- ✅ **Open/Closed Principle**: Nuevas estrategias sin modificar código existente
- ✅ **Single Responsibility**: Cada estrategia tiene una única responsabilidad
- ✅ **Composición dinámica**: Estrategias se pueden combinar en el Chain of Responsibility
- ✅ **Configuración sin redespliegue**: Parámetros configurables vía API o env vars

---

## 1. AmountThresholdStrategy (HU-003)

### Descripción
Detecta transacciones que exceden un umbral de monto configurable.

### Parámetros
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `threshold` | Decimal | 1500.0 | Monto máximo permitido (USD) |

### Lógica
```
SI amount > threshold ENTONCES
    risk_level = HIGH_RISK
    reason = "amount_exceeds_threshold"
SINO
    risk_level = LOW_RISK
```

### Configuración
```python
# En .env o variables de entorno
AMOUNT_THRESHOLD=1500.0
```

### Endpoints para modificar
```bash
# Consultar configuración actual
GET /api/v1/admin/rules

# Actualizar umbral
PUT /api/v1/admin/rules/rule_amount_threshold
Headers: X-Analyst-ID: analyst_001
Body: {
  "parameters": {
    "threshold": 2000.0
  }
}
```

---

## 2. LocationStrategy (HU-005)

### Descripción
Detecta transacciones desde ubicaciones lejanas a la última ubicación conocida del usuario.

### Parámetros
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `radius_km` | float | 100.0 | Radio máximo en kilómetros |

### Lógica
```
distancia = haversine(ubicacion_actual, ubicacion_historica)
SI distancia > radius_km ENTONCES
    risk_level = HIGH_RISK
    reason = "unusual_location"
SINO
    risk_level = LOW_RISK
```

### Fórmula de Haversine
Calcula la distancia geodésica entre dos puntos en la esfera terrestre:

```python
distance = 2 * R * arcsin(sqrt(
    sin²((lat2 - lat1) / 2) + 
    cos(lat1) * cos(lat2) * sin²((lon2 - lon1) / 2)
))
```

Donde R = 6371 km (radio de la Tierra).

### Configuración
```python
LOCATION_RADIUS_KM=100.0
```

---

## 3. DeviceValidationStrategy (HU-004)

### Descripción
Valida que el `device_id` de la transacción esté en la lista de dispositivos conocidos del usuario almacenados en Redis.

### Parámetros
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `known_devices` | Set[str] | Set de device IDs registrados |

### Lógica
```
SI device_id es None ENTONCES
    risk_level = MEDIUM_RISK
    reason = "no_device_id"
SINO SI device_id NOT IN known_devices ENTONCES
    risk_level = HIGH_RISK
    reason = "unknown_device"
SINO
    risk_level = LOW_RISK
```

### Estructura de datos en Redis
```python
# Clave: "user_devices:{user_id}"
# Valor: Set de device IDs
# TTL: Sin expiración (persistente)

Example:
"user_devices:user_001" -> {"device_mobile_001", "device_web_002"}
```

### Registro automático de dispositivos
En la primera transacción de un usuario, el dispositivo se registra automáticamente.

---

## 4. RapidTransactionStrategy (HU-006) 🆕

### Descripción
Detecta múltiples transacciones del mismo usuario en corto tiempo, previniendo ataques de consumo masivo.

### Parámetros
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `transaction_limit` | int | 3 | Máximo de transacciones permitidas |
| `time_window_seconds` | int | 300 | Ventana de tiempo en segundos (5 min) |

### Lógica
```
contador = obtener_contador_de_redis(user_id)
SI contador > transaction_limit ENTONCES
    risk_level = MEDIUM_RISK
    reason = "rapid_transaction_pattern"
SINO
    risk_level = LOW_RISK
incrementar_contador(user_id)
```

### Estructura de datos en Redis
```python
# Clave: "rapid_tx:{user_id}"
# Valor: {"count": int, "first_tx_time": ISO timestamp}
# TTL: time_window_seconds (300 segundos)

Example:
"rapid_tx:user_001" -> {
    "count": 4,
    "first_tx_time": "2026-01-09T10:15:00"
}
```

### Configuración
```python
RAPID_TX_LIMIT=3
RAPID_TX_WINDOW=300
```

### Reinicio del contador
El contador se reinicia automáticamente cuando:
1. Expira el TTL de Redis (después de `time_window_seconds`)
2. Han pasado más de `time_window_seconds` desde la primera transacción

---

## 5. UnusualTimeStrategy (HU-007) 🆕

### Descripción
Detecta transacciones en horarios atípicos basados en el patrón horario del usuario.

### Parámetros
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `min_transactions_for_pattern` | int | 5 | Mínimo de transacciones para establecer patrón |
| `outlier_threshold_hours` | int | 4 | Diferencia en horas para considerar inusual |

### Lógica
```
historial_horas = obtener_horas_de_transacciones_previas(user_id)
SI len(historial_horas) < min_transactions_for_pattern ENTONCES
    risk_level = LOW_RISK  # Sin suficiente historial
SINO
    hora_actual = transaction.timestamp.hour
    horas_frecuentes = calcular_horas_frecuentes(historial_horas)
    
    SI hora_actual NOT IN rango_de_horas_frecuentes(±outlier_threshold_hours) ENTONCES
        risk_level = MEDIUM_RISK
        reason = "unusual_transaction_time"
    SINO
        risk_level = LOW_RISK
```

### Ejemplo
```
Usuario con historial:
- 10 transacciones entre 9am - 6pm
- Patrón identificado: horas laborales

Transacción a las 3am:
- Diferencia: 6 horas de la hora más cercana (9am)
- threshold = 4 horas
- Resultado: MEDIUM_RISK
```

### Configuración
```python
MIN_TRANSACTIONS_FOR_TIME_PATTERN=5
UNUSUAL_TIME_THRESHOLD_HOURS=4
```

---

## Activación de Estrategias

### En fraud-evaluation-service

Las estrategias se inicializan en `main.py`:

```python
# Estrategias estáticas (no requieren servicios)
fraud_strategies = [
    AmountThresholdStrategy(threshold=Decimal(str(settings.amount_threshold))),
    LocationStrategy(radius_km=settings.location_radius_km),
]

# Estrategias dinámicas (requieren Redis/MongoDB)
def get_evaluate_use_case() -> EvaluateTransactionUseCase:
    dynamic_strategies = fraud_strategies.copy()
    
    # HU-006: RapidTransactionStrategy
    dynamic_strategies.append(
        RapidTransactionStrategy(
            cache_service=redis_adapter,
            transaction_limit=settings.rapid_tx_limit,
            time_window_seconds=settings.rapid_tx_window
        )
    )
    
    # HU-007: UnusualTimeStrategy
    dynamic_strategies.append(
        UnusualTimeStrategy(
            repository=mongodb_adapter,
            min_transactions_for_pattern=settings.min_transactions_for_time_pattern,
            outlier_threshold_hours=settings.unusual_time_threshold_hours
        )
    )
    
    return EvaluateTransactionUseCase(
        repository=mongodb_adapter,
        publisher=rabbitmq_adapter,
        cache=redis_adapter,
        strategies=dynamic_strategies,
    )
```

---

## Chain of Responsibility

Las estrategias se ejecutan en **secuencia** (Chain of Responsibility pattern):

1. AmountThresholdStrategy
2. LocationStrategy
3. RapidTransactionStrategy
4. UnusualTimeStrategy
5. DeviceValidationStrategy (si `device_id` está presente)

### Evaluación de riesgo agregado
```python
risk_levels = [strategy.evaluate(tx) for strategy in strategies]
final_risk = max(risk_levels)  # El nivel más alto determina el riesgo final
```

### Niveles de riesgo
- **LOW_RISK** (0-30): Transacción aprobada automáticamente
- **MEDIUM_RISK** (31-70): Enviada a cola de revisión manual
- **HIGH_RISK** (71-100): Bloqueada automáticamente o revisión prioritaria

---

## Testing

### Unit Tests
Cada estrategia tiene tests unitarios en:
```
tests/unit/strategies/
├── test_amount_threshold.py
├── test_location_check.py
├── test_device_validation.py
├── test_rapid_transaction.py  🆕
└── test_unusual_time.py        🆕
```

### Integration Tests
Tests de integración con servicios reales:
```
tests/integration/
└── test_fraud_strategies_integration.py
```

---

## Troubleshooting

### RapidTransactionStrategy no funciona
**Problema**: El contador no se incrementa.  
**Solución**: Verificar que Redis esté corriendo y accesible.

```bash
# Verificar conexión Redis
redis-cli ping  # Debe retornar PONG

# Verificar claves
redis-cli KEYS "rapid_tx:*"
```

### UnusualTimeStrategy siempre retorna LOW_RISK
**Problema**: No hay suficiente historial de transacciones.  
**Solución**: La estrategia requiere al menos 5 transacciones previas. Verificar en MongoDB:

```bash
# Verificar transacciones del usuario
db.evaluations.find({user_id: "user_001"}).count()
```

### DeviceValidationStrategy no registra dispositivos
**Problema**: Dispositivos no persisten en Redis.  
**Solución**: Verificar TTL y que la clave se esté guardando sin expiración:

```bash
redis-cli TTL "user_devices:user_001"  # Debe retornar -1 (sin expiración)
```

---

## Cumplimiento de Principios SOLID

✅ **Single Responsibility**: Cada estrategia tiene una única responsabilidad de detección  
✅ **Open/Closed**: Nuevas estrategias sin modificar código existente  
✅ **Liskov Substitution**: Todas las estrategias son intercambiables  
✅ **Interface Segregation**: Interfaz `FraudStrategy` minimalista  
✅ **Dependency Inversion**: Estrategias dependen de abstracciones (interfaces)

---

**Documento creado:** Enero 9, 2026  
**Versión:** 1.0  
**Autor:** María Paula Gutiérrez
