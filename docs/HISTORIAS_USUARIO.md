# 📖 Historias de Usuario - Fraud Detection Engine

## Principios INVEST

Todas las historias de usuario siguen los principios INVEST:
- **I**ndependent (Independientes)
- **N**egotiable (Negociables)
- **V**aluable (Valiosas para el negocio)
- **E**stimable (Estimables)
- **S**mall (Pequeñas)
- **T**estable (Comprobables)

---

## Epic 1: Recepción y Evaluación de Transacciones

### HU-001: Recepción de Transacciones por API

**Como** sistema externo  
**Quiero** enviar transacciones al motor de fraude vía API REST  
**Para** que sean evaluadas de forma asíncrona

**Descripción:**  
El sistema debe exponer un endpoint REST que reciba transacciones con información del usuario, monto, ubicación y dispositivo. La respuesta debe ser inmediata (202 Accepted) y el procesamiento ocurre de forma asíncrona.

**Criterios de Aceptación:**

```gherkin
Feature: Recepción de transacciones por API

  Scenario: Recepción exitosa de transacción válida
    Given el API está disponible en "http://localhost:8000"
    And tengo una transacción válida con:
      | campo     | valor                |
      | userId    | user_001             |
      | amount    | 500.00               |
      | location  | 4.7110,-74.0721      |
      | deviceId  | device_mobile_001    |
    When envío la transacción al endpoint POST "/api/v1/transaction/validate"
    Then recibo status code 202
    And el response contiene "message" con "Transaction received for processing"
    And el response contiene "transaction_id"

  Scenario: Rechazo de transacción sin userId
    Given el API está disponible
    And tengo una transacción sin userId
    When envío la transacción al endpoint
    Then recibo status code 422
    And el response contiene "detail" con "userId is required"

  Scenario: Rechazo de transacción con monto negativo
    Given el API está disponible
    And tengo una transacción con amount -100.00
    When envío la transacción al endpoint
    Then recibo status code 422
    And el response contiene "detail" con "amount must be positive"

  Scenario: Rechazo de transacción con ubicación inválida
    Given el API está disponible
    And tengo una transacción con location "INVALID_GPS"
    When envío la transacción al endpoint
    Then recibo status code 422
    And el response contiene "detail" con "invalid location format"
```

**Estimación:** 3 puntos  
**Prioridad:** Alta  
**Dependencias:** Ninguna

---

### HU-002: Auditoría de Evaluaciones

**Como** administrador  
**Quiero** que todas las evaluaciones de fraude queden registradas en un log inmutable  
**Para** cumplir con requisitos de compliance y auditoría

**Descripción:**  
Cada evaluación de fraude debe registrarse en MongoDB con toda la información de la transacción, estrategias aplicadas, resultado y timestamp. Los registros no deben ser modificables.

**Criterios de Aceptación:**

```gherkin
Feature: Auditoría inmutable de evaluaciones

  Scenario: Registro de evaluación exitosa
    Given una transacción fue procesada con resultado "LOW_RISK"
    When consulto el log de auditoría para esa transacción
    Then encuentro un registro con:
      | campo              | valor                  |
      | transaction_id     | [ID de transacción]    |
      | user_id            | user_001               |
      | amount             | 500.00                 |
      | risk_level         | LOW_RISK               |
      | strategies_applied | [lista de estrategias] |
      | timestamp          | [fecha/hora]           |

  Scenario: Consulta de auditoría por usuario
    Given existen 5 transacciones del usuario "user_001"
    When consulto GET "/api/v1/audit/user/user_001"
    Then recibo status code 200
    And el response contiene 5 registros
    And los registros están ordenados por timestamp descendente

  Scenario: Consulta de auditoría por nivel de riesgo
    Given existen transacciones con diferentes niveles de riesgo
    When consulto GET "/api/v1/audit/risk-level/HIGH_RISK"
    Then recibo status code 200
    And todos los registros tienen risk_level "HIGH_RISK"

  Scenario: Inmutabilidad del log de auditoría
    Given existe un registro de auditoría con ID "audit_001"
    When intento actualizar ese registro con PUT
    Then recibo status code 405 (Method Not Allowed)
    And el registro original permanece sin cambios
```

**Estimación:** 5 puntos  
**Prioridad:** Alta  

---

## Epic 2: Reglas de Detección de Fraude

### HU-003: Regla de Umbral de Monto

**Como** sistema de detección  
**Quiero** marcar transacciones que excedan un umbral de monto configurable  
**Para** detectar transacciones inusualmente altas

**Descripción:**  
Implementar una estrategia que evalúe si el monto de la transacción excede un umbral predefinido (inicialmente $1,500 USD). Las transacciones que excedan este monto deben marcarse como ALTO_RIESGO.

**Criterios de Aceptación:**

```gherkin
Feature: Detección por umbral de monto

  Scenario: Transacción dentro del umbral
    Given el umbral de monto está configurado en 1500.00
    And una transacción con amount 800.00
    When se aplica la estrategia AmountThresholdStrategy
    Then el resultado de la estrategia es "PASS"
    And no se incrementa el nivel de riesgo

  Scenario: Transacción que excede el umbral
    Given el umbral de monto está configurado en 1500.00
    And una transacción con amount 2000.00
    When se aplica la estrategia AmountThresholdStrategy
    Then el resultado de la estrategia es "FAIL"
    And el nivel de riesgo se marca como "HIGH_RISK"
    And el motivo contiene "Amount exceeds threshold"

  Scenario: Transacción exactamente en el umbral
    Given el umbral de monto está configurado en 1500.00
    And una transacción con amount 1500.00
    When se aplica la estrategia AmountThresholdStrategy
    Then el resultado de la estrategia es "PASS"
    And no se incrementa el nivel de riesgo
```

**Estimación:** 3 puntos  
**Prioridad:** Alta  
---

### HU-004: Validación de Dispositivo Conocido

**Como** sistema de detección  
**Quiero** validar que el dispositivo utilizado esté registrado para el usuario  
**Para** detectar posibles accesos no autorizados

**Descripción:**  
Verificar que el deviceId de la transacción esté en la lista de dispositivos conocidos del usuario almacenados en Redis. Dispositivos desconocidos incrementan el nivel de riesgo.

**Criterios de Aceptación:**

```gherkin
Feature: Validación de dispositivo conocido

  Scenario: Dispositivo conocido y registrado
    Given el usuario "user_001" tiene dispositivos registrados:
      | deviceId          |
      | device_mobile_001 |
      | device_web_002    |
    And una transacción desde deviceId "device_mobile_001"
    When se aplica la estrategia DeviceValidationStrategy
    Then el resultado de la estrategia es "PASS"
    And no se incrementa el nivel de riesgo

  Scenario: Dispositivo desconocido
    Given el usuario "user_001" tiene dispositivos registrados:
      | deviceId          |
      | device_mobile_001 |
    And una transacción desde deviceId "device_unknown_999"
    When se aplica la estrategia DeviceValidationStrategy
    Then el resultado de la estrategia es "FAIL"
    And el nivel de riesgo se marca como "MEDIUM_RISK"
    And el motivo contiene "Unknown device"

  Scenario: Usuario sin dispositivos registrados (primera transacción)
    Given el usuario "user_new_001" no tiene dispositivos registrados
    And una transacción desde deviceId "device_mobile_001"
    When se aplica la estrategia DeviceValidationStrategy
    Then el resultado de la estrategia es "PASS"
    And el dispositivo se registra automáticamente
    And no se incrementa el nivel de riesgo
```

**Estimación:** 5 puntos  
**Prioridad:** Media  

---

### HU-005: Regla de Ubicación Inusual

**Como** sistema de detección  
**Quiero** detectar transacciones desde ubicaciones lejanas a la ubicación habitual del usuario  
**Para** prevenir fraudes por takeover geográfico

**Descripción:**  
Calcular la distancia entre la ubicación actual de la transacción y la última ubicación conocida del usuario. Si la distancia excede 100 km, marcar como ALTO_RIESGO.

**Criterios de Aceptación:**

```gherkin
Feature: Detección de ubicación inusual

  Scenario: Transacción desde ubicación cercana
    Given el usuario "user_001" tiene última ubicación en "4.7110,-74.0721" (Bogotá)
    And una transacción desde ubicación "4.6097,-74.0817" (30 km de distancia)
    When se aplica la estrategia UnusualLocationStrategy
    Then el resultado de la estrategia es "PASS"
    And no se incrementa el nivel de riesgo

  Scenario: Transacción desde ubicación lejana
    Given el usuario "user_001" tiene última ubicación en "4.7110,-74.0721" (Bogotá)
    And una transacción desde ubicación "6.2442,-75.5812" (200 km de distancia, Medellín)
    When se aplica la estrategia UnusualLocationStrategy
    Then el resultado de la estrategia es "FAIL"
    And el nivel de riesgo se marca como "HIGH_RISK"
    And el motivo contiene "Unusual location distance: 200 km"

  Scenario: Primera transacción del usuario sin historial de ubicación
    Given el usuario "user_new_001" no tiene ubicaciones registradas
    And una transacción desde cualquier ubicación
    When se aplica la estrategia UnusualLocationStrategy
    Then el resultado de la estrategia es "PASS"
    And la ubicación se registra como ubicación base
    And no se incrementa el nivel de riesgo

  Scenario: Transacción exactamente a 100 km
    Given el usuario "user_001" tiene última ubicación conocida
    And una transacción desde ubicación a exactamente 100.0 km
    When se aplica la estrategia UnusualLocationStrategy
    Then el resultado de la estrategia es "PASS"
    And no se incrementa el nivel de riesgo
```

**Estimación:** 5 puntos  
**Prioridad:** Alta  

---

### HU-006: Detección de Transacciones en Cadena

**Como** sistema de detección  
**Quiero** detectar múltiples transacciones del mismo usuario en corto tiempo  
**Para** prevenir ataques de consumo masivo

**Descripción:**  
Si un usuario realiza más de 3 transacciones en menos de 5 minutos, el sistema debe marcar las transacciones subsecuentes como sospechosas.

**Criterios de Aceptación:**

```gherkin
Feature: Detección de transacciones en cadena

  Scenario: Transacciones espaciadas normalmente
    Given el usuario "user_001" realizó 2 transacciones en los últimos 30 minutos
    When el usuario realiza una nueva transacción
    Then el resultado de la estrategia RapidTransactionStrategy es "PASS"
    And no se incrementa el nivel de riesgo

  Scenario: Cuarta transacción en menos de 5 minutos
    Given el usuario "user_001" realizó 3 transacciones en los últimos 4 minutos
    When el usuario realiza una cuarta transacción
    Then el resultado de la estrategia RapidTransactionStrategy es "FAIL"
    And el nivel de riesgo se marca como "MEDIUM_RISK"
    And el motivo contiene "Rapid transaction pattern detected"

  Scenario: Reinicio del contador después de 5 minutos
    Given el usuario "user_001" realizó 3 transacciones hace 6 minutos
    When el usuario realiza una nueva transacción
    Then el resultado de la estrategia RapidTransactionStrategy es "PASS"
    And el contador se reinicia a 1
```

**Estimación:** 5 puntos  
**Prioridad:** Media 

---

### HU-007: Detección de Horario Inusual

**Como** sistema de detección  
**Quiero** detectar transacciones en horarios atípicos para el usuario  
**Para** identificar posible uso no autorizado

**Descripción:**  
Analizar el patrón de horarios de transacciones del usuario. Si una transacción ocurre en un horario significativamente diferente al patrón habitual (ej: transacción a las 3am cuando el usuario siempre opera entre 9am-6pm), incrementar el nivel de riesgo.

**Criterios de Aceptación:**

```gherkin
Feature: Detección de horario inusual

  Scenario: Transacción en horario habitual
    Given el usuario "user_001" tiene patrón de transacciones entre 9:00 AM y 6:00 PM
    When el usuario realiza una transacción a las 2:00 PM
    Then el resultado de la estrategia UnusualTimeStrategy es "PASS"
    And no se incrementa el nivel de riesgo

  Scenario: Transacción en horario inusual
    Given el usuario "user_001" tiene patrón de transacciones entre 9:00 AM y 6:00 PM
    When el usuario realiza una transacción a las 3:00 AM
    Then el resultado de la estrategia UnusualTimeStrategy es "FAIL"
    And el nivel de riesgo se marca como "MEDIUM_RISK"
    And el motivo contiene "Transaction at unusual hour: 03:00"

  Scenario: Usuario nuevo sin patrón establecido
    Given el usuario "user_new_001" no tiene historial de transacciones
    When el usuario realiza una transacción a cualquier hora
    Then el resultado de la estrategia UnusualTimeStrategy es "PASS"
    And no se incrementa el nivel de riesgo
```

**Estimación:** 5 puntos  
**Prioridad:** Baja  

---

## Epic 3: Gobernanza y Configuración

### HU-008: Modificación de Umbrales sin Redespliegue

**Como** administrador  
**Quiero** modificar los umbrales de las reglas de fraude vía API  
**Para** ajustar el sistema sin necesidad de redesplegar código

**Descripción:**  
Exponer un endpoint que permita actualizar los parámetros de configuración de las estrategias de fraude (umbrales de monto, distancia, etc.) que se aplican inmediatamente a nuevas transacciones.

**Criterios de Aceptación:**

```gherkin
Feature: Modificación dinámica de umbrales

  Scenario: Actualización exitosa del umbral de monto
    Given el umbral de monto actual es 1500.00
    When envío PUT "/api/v1/admin/config" con:
      | campo            | valor   |
      | amount_threshold | 2000.00 |
    Then recibo status code 200
    And el response confirma "Configuration updated successfully"
    And el nuevo umbral es 2000.00
    And las transacciones subsecuentes usan el nuevo umbral

  Scenario: Actualización del umbral de distancia
    Given el umbral de distancia actual es 100 km
    When envío PUT "/api/v1/admin/config" con:
      | campo               | valor |
      | distance_threshold  | 150   |
    Then recibo status code 200
    And el nuevo umbral de distancia es 150 km

  Scenario: Rechazo de valor de umbral inválido
    Given quiero actualizar el umbral de monto
    When envío PUT "/api/v1/admin/config" con amount_threshold -500.00
    Then recibo status code 422
    And el response contiene "amount_threshold must be positive"
    And el umbral anterior permanece sin cambios

  Scenario: Múltiples parámetros actualizados simultáneamente
    When envío PUT "/api/v1/admin/config" con:
      | campo               | valor   |
      | amount_threshold    | 2000.00 |
      | distance_threshold  | 150     |
    Then recibo status code 200
    And ambos parámetros se actualizan correctamente
```

**Estimación:** 3 puntos  
**Prioridad:** Alta  

---

### HU-009: Consulta de Configuración Actual

**Como** administrador  
**Quiero** consultar la configuración actual de umbrales y parámetros  
**Para** conocer el estado del sistema antes de modificarlo

**Descripción:**  
Exponer un endpoint que retorne todos los parámetros de configuración actuales del motor de fraude.

**Criterios de Aceptación:**

```gherkin
Feature: Consulta de configuración actual

  Scenario: Consulta exitosa de configuración
    Given el sistema tiene configuración por defecto
    When envío GET "/api/v1/admin/config"
    Then recibo status code 200
    And el response contiene:
      | parámetro           | valor   |
      | amount_threshold    | 1500.00 |
      | distance_threshold  | 100     |
      | rapid_tx_limit      | 3       |
      | rapid_tx_window     | 300     |

  Scenario: Consulta de configuración después de actualización
    Given actualicé el amount_threshold a 2000.00
    When envío GET "/api/v1/admin/config"
    Then recibo status code 200
    And el response muestra amount_threshold 2000.00
```

**Estimación:** 2 puntos  
**Prioridad:** Media  

---

### HU-011: Gestión de Reglas Personalizadas

**Como** administrador  
**Quiero** crear, activar y desactivar reglas de fraude personalizadas  
**Para** extender el sistema sin modificar código

**Descripción:**  
Permitir al administrador crear nuevas reglas de fraude mediante el dashboard, definiendo parámetros en JSON, prioridad y estado (activa/inactiva).

**Criterios de Aceptación:**

```gherkin
Feature: Gestión de reglas personalizadas

  Scenario: Creación exitosa de regla personalizada
    Given estoy autenticado como administrador
    When envío POST "/api/v1/admin/rules" con:
      | campo      | valor                                    |
      | name       | Regla Monto Alto VIP                     |
      | type       | amount_threshold                         |
      | parameters | {"threshold": 5000.0, "user_type": "VIP"}|
      | priority   | 10                                       |
      | enabled    | true                                     |
    Then recibo status code 201
    And el response contiene el ID de la nueva regla
    And la regla aparece en GET "/api/v1/admin/rules"

  Scenario: Desactivación de regla existente
    Given existe una regla con ID "rule_001" y estado "enabled: true"
    When envío PATCH "/api/v1/admin/rules/rule_001" con enabled: false
    Then recibo status code 200
    And la regla se marca como inactiva
    And no se aplica en evaluaciones subsecuentes

  Scenario: Rechazo de regla con JSON inválido
    When envío POST "/api/v1/admin/rules" con parameters "INVALID_JSON"
    Then recibo status code 422
    And el response contiene "Invalid JSON in parameters field"

  Scenario: Eliminación de regla personalizada
    Given existe una regla personalizada con ID "rule_002"
    When envío DELETE "/api/v1/admin/rules/rule_002"
    Then recibo status code 204
    And la regla ya no aparece en GET "/api/v1/admin/rules"
```

**Estimación:** 8 puntos  
**Prioridad:** Media  

---

## Epic 4: Human in the Loop

### HU-010: Envío de Transacciones a Cola de Revisión Manual

**Como** sistema de evaluación  
**Quiero** enviar transacciones de RIESGO MEDIO/ALTO a una cola de mensajes  
**Para** que sean revisadas manualmente por un analista

**Descripción:**  
Las transacciones que resulten en MEDIUM_RISK o HIGH_RISK deben publicarse en una cola de RabbitMQ para revisión manual. Las transacciones de LOW_RISK se aprueban automáticamente.

**Criterios de Aceptación:**

```gherkin
Feature: Encolamiento para revisión manual

  Scenario: Transacción de bajo riesgo se aprueba automáticamente
    Given una transacción evaluada con resultado "LOW_RISK"
    When el worker procesa la transacción
    Then la transacción se marca como "APPROVED"
    And NO se envía a la cola de revisión manual
    And se registra en auditoría con status "AUTO_APPROVED"

  Scenario: Transacción de riesgo medio se envía a revisión
    Given una transacción evaluada con resultado "MEDIUM_RISK"
    When el worker procesa la transacción
    Then la transacción se publica en la cola "fraud_review_queue"
    And el status se marca como "PENDING_REVIEW"
    And se registra en auditoría con status "PENDING_REVIEW"

  Scenario: Transacción de alto riesgo se envía a revisión prioritaria
    Given una transacción evaluada con resultado "HIGH_RISK"
    When el worker procesa la transacción
    Then la transacción se publica en la cola con prioridad ALTA
    And el status se marca como "PENDING_REVIEW"
    And se genera notificación al analista de guardia
```

**Estimación:** 5 puntos  
**Prioridad:** Alta  

---

### HU-012: Revisión Manual de Transacciones Sospechosas

**Como** analista de fraude  
**Quiero** revisar transacciones sospechosas desde el dashboard  
**Para** decidir si aprobarlas o rechazarlas

**Descripción:**  
El dashboard administrativo debe mostrar transacciones pendientes de revisión y permitir al analista aprobarlas o rechazarlas con justificación.

**Criterios de Aceptación:**

```gherkin
Feature: Revisión manual por analista

  Scenario: Listado de transacciones pendientes
    Given existen 5 transacciones con status "PENDING_REVIEW"
    When el analista accede a GET "/api/v1/admin/transactions/pending"
    Then recibo status code 200
    And el response contiene 5 transacciones
    And cada transacción muestra: ID, usuario, monto, riesgo, motivos

  Scenario: Aprobación de transacción por analista
    Given una transacción con ID "tx_001" en status "PENDING_REVIEW"
    When el analista envía PUT "/api/v1/admin/transactions/tx_001/review" con:
      | campo     | valor                              |
      | decision  | APPROVED                           |
      | notes     | Usuario verificado por llamada     |
      | analyst   | analyst_001                        |
    Then recibo status code 200
    And la transacción se marca como "APPROVED"
    And se registra en auditoría la decisión del analista
    And el usuario recibe notificación de aprobación

  Scenario: Rechazo de transacción por analista
    Given una transacción con ID "tx_002" en status "PENDING_REVIEW"
    When el analista envía PUT "/api/v1/admin/transactions/tx_002/review" con:
      | campo     | valor                              |
      | decision  | REJECTED                           |
      | notes     | Ubicación no verificada, fraude confirmado |
      | analyst   | analyst_001                        |
    Then recibo status code 200
    And la transacción se marca como "REJECTED"
    And se registra en auditoría la decisión del analista
    And el usuario recibe notificación de rechazo

  Scenario: Intento de revisión sin justificación
    When el analista envía PUT con decision pero sin campo "notes"
    Then recibo status code 422
    And el response contiene "notes field is required"
```

**Estimación:** 8 puntos  
**Prioridad:** Alta  

---

## Epic 5: Visualización y Reportes

### HU-013: Dashboard de Usuario - Historial de Transacciones

**Como** usuario final  
**Quiero** ver el historial de mis transacciones y su estado  
**Para** conocer cuáles fueron aprobadas o rechazadas

**Descripción:**  
El frontend de usuario debe mostrar una lista de transacciones propias con su estado, monto, fecha y nivel de riesgo detectado.

**Criterios de Aceptación:**

```gherkin
Feature: Historial de transacciones del usuario

  Scenario: Usuario consulta su historial
    Given el usuario "user_001" está autenticado
    And tiene 10 transacciones en el sistema
    When accede a GET "/api/v1/user/transactions"
    Then recibo status code 200
    And el response contiene 10 transacciones
    And cada transacción muestra: ID, monto, fecha, status, risk_level

  Scenario: Filtro por rango de fechas
    Given el usuario tiene transacciones desde enero a marzo
    When consulta GET "/api/v1/user/transactions?from=2026-02-01&to=2026-02-28"
    Then recibo solo las transacciones de febrero

  Scenario: Usuario no puede ver transacciones de otros usuarios
    Given el usuario "user_001" está autenticado
    When intenta acceder a GET "/api/v1/user/transactions?userId=user_002"
    Then recibo status code 403
    And el response contiene "Access denied"
```

**Estimación:** 5 puntos  
**Prioridad:** Media  

---

### HU-014: Dashboard Admin - Métricas de Fraude

**Como** administrador  
**Quiero** ver métricas y estadísticas de detección de fraude  
**Para** monitorear la efectividad del sistema

**Descripción:**  
El dashboard administrativo debe mostrar métricas clave: total de transacciones evaluadas, porcentaje por nivel de riesgo, tasa de falsos positivos, tiempo promedio de revisión.

**Criterios de Aceptación:**

```gherkin
Feature: Dashboard de métricas de fraude

  Scenario: Visualización de métricas generales
    Given existen transacciones en el sistema
    When el admin accede a GET "/api/v1/admin/metrics"
    Then recibo status code 200
    And el response contiene:
      | métrica                    | tipo    |
      | total_transactions         | number  |
      | low_risk_percentage        | number  |
      | medium_risk_percentage     | number  |
      | high_risk_percentage       | number  |
      | avg_review_time_minutes    | number  |
      | false_positive_rate        | number  |

  Scenario: Métricas filtradas por fecha
    When consulta GET "/api/v1/admin/metrics?from=2026-01-01&to=2026-01-31"
    Then recibo métricas solo del mes de enero

  Scenario: Top 10 usuarios con más transacciones sospechosas
    When consulta GET "/api/v1/admin/metrics/top-suspicious-users"
    Then recibo una lista de 10 usuarios
    And cada usuario muestra: userId, suspicious_count, last_incident
```

**Estimación:** 8 puntos  
**Prioridad:** Media  

---

## Epic 6: Frontend Admin Dashboard

### HU-015: Visualizar Dashboard de Métricas Administrativo

**Como** administrador  
**Quiero** visualizar un dashboard con métricas de fraude en tiempo real  
**Para** monitorear el estado del sistema de forma visual

**Descripción:**  
El dashboard administrativo debe mostrar KPIs visuales con total de transacciones, porcentajes de riesgo, tendencias en gráficos y transacciones recientes.

**Criterios de Aceptación:**

```gherkin
Feature: Dashboard administrativo visual

  Scenario: Visualización de KPIs principales
    Given el administrador accede al dashboard
    And existen transacciones en el sistema
    When la página carga los datos
    Then se muestran 4 tarjetas KPI con:
      | KPI                     | Información mostrada        |
      | Total Transacciones     | Número total y variación    |
      | Bajo Riesgo             | Porcentaje y variación      |
      | Riesgo Medio            | Porcentaje y variación      |
      | Alto Riesgo             | Porcentaje y variación      |
    And cada KPI muestra indicador visual de tendencia (↑/↓)

  Scenario: Visualización de gráfico de tendencias
    Given existen transacciones históricas
    When el dashboard carga
    Then se muestra un gráfico de líneas con tendencias temporales
    And el gráfico incluye leyenda de colores por nivel de riesgo

  Scenario: Lista de transacciones recientes
    Given existen transacciones en las últimas 24 horas
    When el dashboard carga
    Then se muestra tabla con las 10 transacciones más recientes
    And cada transacción muestra: ID, usuario, monto, estado, riesgo

  Scenario: Estado de carga del dashboard
    Given el administrador accede al dashboard
    When los datos están siendo cargados
    Then se muestra mensaje "Cargando..." con spinner
    And no se muestran datos parciales
```

**Estimación:** 5 puntos  
**Prioridad:** Alta  

---

### HU-016: Gestión de Transacciones desde UI Administrativa

**Como** administrador  
**Quiero** ver, filtrar y revisar transacciones desde el dashboard  
**Para** aprobar o rechazar transacciones sospechosas

**Descripción:**  
La página de transacciones debe permitir listar todas las transacciones, filtrar por estado (ALL, SUSPICIOUS, APPROVED, REJECTED) y aprobar/rechazar con botones.

**Criterios de Aceptación:**

```gherkin
Feature: Gestión visual de transacciones

  Scenario: Listado completo de transacciones
    Given el administrador accede a la página de transacciones
    When la página carga
    Then se muestra tabla con todas las transacciones
    And cada fila incluye: ID, usuario, monto, ubicación, estado, nivel riesgo
    And las transacciones están ordenadas por fecha descendente

  Scenario: Filtrado por estado SUSPICIOUS
    Given existen transacciones con diferentes estados
    When el administrador selecciona filtro "SUSPICIOUS"
    Then solo se muestran transacciones con status "SUSPICIOUS"
    And se muestra contador "X transacciones sospechosas"

  Scenario: Aprobación de transacción desde UI
    Given una transacción con status "SUSPICIOUS"
    When el administrador hace clic en botón "Aprobar"
    Then se envía petición PUT al endpoint de review
    And la transacción cambia a status "APPROVED"
    And se muestra alerta "Transacción aprobada exitosamente"
    And la tabla se actualiza automáticamente

  Scenario: Rechazo de transacción desde UI
    Given una transacción con status "SUSPICIOUS"
    When el administrador hace clic en botón "Rechazar"
    Then se envía petición PUT con decision "REJECTED"
    And la transacción cambia a status "REJECTED"
    And se muestra alerta de confirmación

  Scenario: Indicador de carga al revisar
    Given una transacción está siendo revisada
    When se procesa la acción de aprobar/rechazar
    Then se muestra indicador de carga durante el proceso
    And los botones se deshabilitan temporalmente
```

**Estimación:** 5 puntos  
**Prioridad:** Alta  

---

### HU-017: Gestión de Reglas desde UI Administrativa

**Como** administrador  
**Quiero** crear, editar y activar/desactivar reglas de fraude desde el dashboard  
**Para** configurar el sistema sin modificar código

**Descripción:**  
La página de reglas debe permitir visualizar todas las reglas, editar sus parámetros, crear nuevas reglas personalizadas y cambiar su estado (enabled/disabled).

**Criterios de Aceptación:**

```gherkin
Feature: Gestión visual de reglas de fraude

  Scenario: Visualización de todas las reglas
    Given existen reglas de fraude configuradas
    When el administrador accede a la página de reglas
    Then se muestra lista con todas las reglas
    And cada regla muestra: nombre, tipo, estado (activa/inactiva), orden

  Scenario: Edición de parámetros de regla existente
    Given una regla "Amount Threshold" con threshold 1500
    When el administrador hace clic en "Editar"
    And modifica el parámetro threshold a 2000
    And hace clic en "Guardar cambios"
    Then se envía PUT a "/api/v1/admin/rules/{id}"
    And se muestra toast "Regla actualizada exitosamente"
    And la lista se refresca con el nuevo valor

  Scenario: Activar/desactivar regla con toggle
    Given una regla con estado enabled: true
    When el administrador hace clic en el toggle de estado
    Then se envía petición PATCH cambiando enabled a false
    And el toggle cambia visualmente a "inactiva"
    And se muestra feedback visual del cambio

  Scenario: Crear nueva regla personalizada
    Given el administrador quiere crear una regla nueva
    When hace clic en botón "Crear nueva regla"
    And completa el formulario con:
      | campo      | valor                     |
      | name       | Regla Custom VIP          |
      | type       | custom                    |
      | parameters | {"max_amount": 5000}      |
      | enabled    | true                      |
      | order      | 100                       |
    And hace clic en "Crear"
    Then se envía POST a "/api/v1/admin/rules"
    And la nueva regla aparece en la lista
    And se muestra toast "Regla creada exitosamente"

  Scenario: Validación de JSON en parámetros
    Given el administrador está editando parámetros de regla
    When ingresa JSON inválido en el campo parameters
    And intenta guardar
    Then se muestra error "JSON inválido en parámetros"
    And no se envía la petición al servidor
```

**Estimación:** 8 puntos  
**Prioridad:** Alta  

---

## Epic 7: Frontend User App

### HU-018: Crear Transacción desde UI de Usuario

**Como** usuario final  
**Quiero** enviar transacciones desde una interfaz web  
**Para** que sean evaluadas por el sistema de fraude

**Descripción:**  
La aplicación de usuario debe proveer un formulario para crear transacciones con campos de userId, monto, ubicación GPS y deviceId, mostrando el resultado de la evaluación.

**Criterios de Aceptación:**

```gherkin
Feature: Creación de transacción desde UI

  Scenario: Envío exitoso de transacción
    Given el usuario está en la página "Nueva Transacción"
    When completa el formulario con:
      | campo    | valor                |
      | userId   | user_demo            |
      | amount   | 500.00               |
      | location | 4.7110,-74.0721      |
      | deviceId | device_mobile_001    |
    And hace clic en "Validar Transacción"
    Then se muestra indicador de "Procesando..."
    And se envía POST a "/api/v1/transaction/validate"
    And se muestra el resultado con nivel de riesgo
    And se muestra animación de resultado exitoso

  Scenario: Visualización de resultado LOW_RISK
    Given una transacción fue evaluada con riskScore "LOW_RISK"
    When se muestra el resultado
    Then se muestra tarjeta verde con título "Transacción Segura"
    And se muestra mensaje "La transacción parece segura"
    And se muestra lista de validaciones pasadas

  Scenario: Visualización de resultado HIGH_RISK
    Given una transacción fue evaluada con riskScore "HIGH_RISK"
    When se muestra el resultado
    Then se muestra tarjeta roja con título "Transacción Bloqueada"
    And se muestra mensaje de advertencia
    And se muestra lista de violaciones detectadas

  Scenario: Selector de usuario persistente
    Given el usuario selecciona "user_001" en el dropdown
    When cierra y vuelve a abrir la aplicación
    Then el selector mantiene "user_001" seleccionado
    And el userId se almacena en localStorage

  Scenario: Nueva transacción después de resultado
    Given se mostró resultado de una transacción anterior
    When el usuario hace clic en "Nueva Transacción"
    Then el formulario se resetea a valores iniciales
    And se oculta el resultado anterior
```

**Estimación:** 5 puntos  
**Prioridad:** Alta  

---

### HU-019: Visualizar Historial de Transacciones en UI de Usuario

**Como** usuario final  
**Quiero** ver mis transacciones anteriores en una lista visual  
**Para** revisar su estado y detalles

**Descripción:**  
La aplicación debe tener una página "Mis Transacciones" que liste todas las transacciones del usuario con filtros, mostrando estado, monto, ubicación y puntuación de riesgo.

**Criterios de Aceptación:**

```gherkin
Feature: Historial visual de transacciones

  Scenario: Navegación a página de transacciones
    Given el usuario está en la página principal
    When hace clic en "Mis Transacciones" en la navegación
    Then se carga la página de transacciones
    And se muestra indicador "Cargando transacciones..."

  Scenario: Visualización de lista de transacciones
    Given el usuario tiene 15 transacciones en el sistema
    When la página de transacciones carga
    Then se muestran las 15 transacciones en tarjetas
    And cada tarjeta muestra: monto, fecha, ubicación, estado, riesgo
    And las tarjetas están ordenadas por fecha descendente

  Scenario: Visualización de estado APPROVED
    Given una transacción tiene status "APPROVED"
    When se muestra en la lista
    Then la tarjeta tiene badge verde con texto "Aprobada"
    And muestra ícono de check verde

  Scenario: Visualización de estado SUSPICIOUS
    Given una transacción tiene status "SUSPICIOUS"
    When se muestra en la lista
    Then la tarjeta tiene badge amarillo con texto "Pendiente"
    And muestra mensaje "En revisión por analista"

  Scenario: Visualización de violaciones detectadas
    Given una transacción tiene violations: ["Amount exceeds threshold"]
    When se expanden los detalles
    Then se muestra lista de violaciones con íconos
    And cada violación se muestra en formato legible

  Scenario: Autenticación de transacción pendiente
    Given una transacción tiene needsAuthentication: true
    And userAuthenticated: null
    When se muestra en la lista
    Then se muestran botones "Confirmar" y "Rechazar"
    And se muestra mensaje "¿Esta transacción fue realizada por ti?"

  Scenario: Confirmación de transacción por usuario
    Given una transacción requiere autenticación
    When el usuario hace clic en "Sí, fui yo"
    Then se envía POST a "/api/v1/transaction/{id}/authenticate"
    And se muestra indicador de carga
    And la transacción se actualiza con userAuthenticated: true
    And desaparecen los botones de autenticación

  Scenario: Rechazo de transacción por usuario
    Given una transacción requiere autenticación
    When el usuario hace clic en "No fui yo"
    Then se envía POST con confirmed: false
    And la transacción se marca como potencial fraude
```

**Estimación:** 8 puntos  
**Prioridad:** Alta  

---

### HU-020: Cambio de Usuario en UI de Usuario

**Como** usuario final  
**Quiero** cambiar el userId activo desde un selector  
**Para** simular diferentes usuarios y ver sus transacciones

**Descripción:**  
La aplicación debe proveer un selector de usuario (dropdown) que permita cambiar el userId activo y actualice automáticamente el contexto y las transacciones mostradas.

**Criterios de Aceptación:**

```gherkin
Feature: Selector de usuario en frontend

  Scenario: Selector visible en ambas páginas
    Given el usuario está en cualquier página de la app
    When observa la interfaz
    Then ve un selector de usuarios en el header/navegación
    And el selector muestra el userId activo actual

  Scenario: Cambio de usuario en página de nueva transacción
    Given el usuario selecciona "user_demo" en el selector
    When cambia a "user_001" en el dropdown
    Then el formulario de transacción se actualiza con userId "user_001"
    And el cambio se persiste en localStorage

  Scenario: Cambio de usuario en página de historial
    Given el usuario está viendo transacciones de "user_demo"
    When cambia a "user_002" en el selector
    Then se recargan las transacciones de "user_002"
    And se muestra indicador de carga durante el cambio

  Scenario: Persistencia del usuario seleccionado
    Given el usuario seleccionó "user_001"
    When recarga la página del navegador
    Then el selector mantiene "user_001" seleccionado
    And se cargan las transacciones de "user_001"
```

**Estimación:** 3 puntos  
**Prioridad:** Media  

---

## Resumen de Estimación

| Epic | Historias | Puntos Totales |
|------|-----------|----------------|
| Epic 1: Recepción y Evaluación | HU-001, HU-002 | 8 |
| Epic 2: Reglas de Fraude | HU-003, HU-004, HU-005, HU-006, HU-007 | 23 |
| Epic 3: Gobernanza | HU-008, HU-009, HU-011 | 13 |
| Epic 4: Human in the Loop | HU-010, HU-012 | 13 |
| Epic 5: Visualización API | HU-013, HU-014 | 13 |
| Epic 6: Frontend Admin Dashboard | HU-015, HU-016, HU-017 | 18 |
| Epic 7: Frontend User App | HU-018, HU-019, HU-020 | 16 |
| **TOTAL** | **20 Historias** | **104 puntos** |

---

## Notas de Implementación

### Funcionalidades Implementadas ✅

**Backend:**
- Recepción y evaluación asíncrona de transacciones (HU-001) ✅
- Auditoría inmutable en MongoDB (HU-002) ✅
- Regla de umbral de monto (HU-003) ✅
- **Validación de dispositivo conocido (HU-004) ✅** 
- Regla de ubicación inusual (HU-005) ✅
- **Detección de transacciones en cadena (HU-006) ✅**
- **Detección de horario inusual (HU-007) ✅**
- Modificación dinámica de umbrales (HU-008, HU-009) ✅
- Gestión de reglas personalizadas (HU-011) ✅
- Cola de revisión manual para transacciones sospechosas (HU-010) ✅
- Revisión manual por analista (HU-012) ✅
- APIs de métricas y auditoría (HU-013, HU-014) ✅

**Frontend Admin Dashboard:**
- Dashboard con KPIs y métricas visuales (HU-015) ✅
- Gestión y revisión de transacciones desde UI (HU-016) ✅
- Creación, edición y activación/desactivación de reglas (HU-017) ✅

**Frontend User App:**
- Formulario de creación de transacciones (HU-018) ✅
- Historial visual de transacciones del usuario (HU-019) ✅
- Selector de usuario con persistencia (HU-020) ✅
- Autenticación de transacciones por el usuario (HU-019) ✅

### Estrategias de Fraude Implementadas

El sistema cuenta con **5 estrategias de detección de fraude**:

1. **AmountThresholdStrategy** (HU-003): Detecta transacciones que exceden umbral configurable ($1,500 por defecto)
2. **LocationStrategy** (HU-005): Detecta transacciones desde ubicaciones lejanas (>100km de la última ubicación)
3. **DeviceValidationStrategy** (HU-004): Valida que el dispositivo esté registrado para el usuario
4. **RapidTransactionStrategy** (HU-006): Detecta más de 3 transacciones en 5 minutos
5. **UnusualTimeStrategy** (HU-007): Detecta transacciones en horarios inusuales basados en el patrón del usuario

Todas las estrategias siguen el patrón **Strategy** y se pueden activar/desactivar mediante configuración.

### Funcionalidades NO Implementadas (Futuro)

Las siguientes funcionalidades quedan fuera del alcance actual:

❌ Gestión de usuarios y dispositivos desde UI Admin  
❌ Exportación de reportes (CSV/PDF)  
❌ Gestión de dispositivos registrados desde UI Usuario  
❌ Sistema de notificaciones en tiempo real  
❌ Autenticación real (OAuth/JWT)  

---

**Documento creado:** Enero 2026  
**Última actualización:** Enero 9, 2026  
**Versión:** 2.1
