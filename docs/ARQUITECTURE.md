Arquitectura del Motor de Reglas de Fraude (Fraud Detection Engine)

## 1. Visión General del Sistema

El Motor de Reglas de Fraude está implementado siguiendo **Arquitectura Limpia (Clean Architecture)** y principios **SOLID**, desplegado como varios servicios coordinados por Docker Compose:

- Núcleo de fraude: `services/fraud-evaluation-service/src`
- API pública (FastAPI): `services/api-gateway/src`
- Worker asíncrono: `services/worker-service/src`

La lógica de negocio (dominio y casos de uso) está desacoplada de FastAPI y de la infraestructura (MongoDB, Redis, RabbitMQ), que se modelan como adaptadores externos.

> Para la estructura de carpetas completa ver `docs/PROJECT_STRUCTURE.md`.  
> Aquí nos centramos en capas lógicas y flujo de datos.

## 2. Estructura de Capas

| Capa | Dónde vive | Componentes Clave | Rol en el Fraude | Restricción Clave |
| :--- | :--------- | :---------------- | :---------------- | :---------------- |
| **Domain (Núcleo)** | `services/fraud-evaluation-service/src/domain` | `Transaction`, `FraudEvaluation`, `RiskLevel`, `FraudStrategy` y estrategias (`amount_threshold`, `location_check`, `rapid_transaction`, `unusual_time`, `device_validation`, etc.) | Lógica pura de reglas (monto, ubicación, tiempo, dispositivo, velocidad, etc.). | **No debe importar Infrastructure ni frameworks.** |
| **Application** | `services/fraud-evaluation-service/src/application` | `EvaluateTransactionUseCase`, `ReviewTransactionUseCase`, interfaces/puertos | Orquesta evaluación, persistencia y notificación *human in the loop*. | Usa inyección de dependencias sobre interfaces. |
| **Infrastructure** | `services/api-gateway/src`, `services/fraud-evaluation-service/src/adapters.py`, `services/worker-service/src` | FastAPI, `MongoDBAdapter`, `RedisAdapter`, `RabbitMQAdapter`, configuración, worker | Adapta el dominio a HTTP, bases de datos y colas. Implementa APIs de entrada y salidas técnicas. | Depende de librerías externas, pero no al revés. |

## 3. Autenticación y Autorización

El sistema implementa autenticación completa con JWT:

1. **Registro de Usuario** (`POST /api/v1/auth/register`):
   - Crea nuevo usuario con email, contraseña hasheada (bcrypt)
   - Genera token de verificación de email
   - Envía correo de verificación (EmailService)
   - Usuario queda en estado `is_verified=false` hasta verificar email

2. **Verificación de Email** (`POST /api/v1/auth/verify-email`):
   - Valida token de verificación
   - Marca usuario como `is_verified=true`
   - Envía correo de bienvenida

3. **Login** (`POST /api/v1/auth/login`):
   - Valida credenciales (user_id, password)
   - Verifica que usuario esté activo y verificado
   - Genera token JWT con expiración configurable
   - Retorna token + datos del usuario

4. **Autorización**:
   - Endpoints protegidos requieren header `Authorization: Bearer <token>`
   - Dependency `get_current_user_from_token` valida JWT
   - Usuarios solo pueden ver sus propias transacciones
   - Administradores tienen acceso completo

**Componentes de Autenticación:**
- `UserRepository`: Persistencia de usuarios en MongoDB
- `PasswordService`: Hash/verificación con bcrypt
- `JWTService`: Generación/validación de tokens JWT
- `EmailService`: Envío de correos (verificación, bienvenida)
- `LoginUserUseCase`, `RegisterUserUseCase`, `VerifyEmailUseCase`: Casos de uso

## 4. Flujo de Procesamiento Asíncrono

1. **Input (API Gateway - FastAPI)**  
   - Recibe `POST /api/v1/transactions/evaluate` desde frontends o clientes externos (requiere autenticación).  
   - Valida el payload y responde `202 Accepted` (HU-001).  
   - Publica un mensaje en RabbitMQ con los datos de la transacción.

2. **Mensajería (RabbitMQ)**  
   - Cola de entrada de transacciones a evaluar.  
   - Desacopla la API del tiempo de procesamiento del motor de fraude.

3. **Worker (`services/worker-service`)**  
   - Consume el mensaje.  
   - Construye entidades de dominio (`Transaction`).  
   - Invoca `EvaluateTransactionUseCase` del núcleo de fraude.

4. **Evaluación (Fraud Evaluation Core)**  
   - Aplica todas las 5 estrategias configuradas:
     - `AmountThresholdStrategy`: monto > umbral
     - `LocationStrategy`: distancia > radio permitido
     - `DeviceValidationStrategy`: dispositivo desconocido
     - `RapidTransactionStrategy`: múltiples transacciones en ventana corta
     - `UnusualTimeStrategy`: horario fuera del patrón habitual
   - Combina resultados: 0 violaciones → LOW_RISK, 1 → MEDIUM_RISK, 2+ → HIGH_RISK
   - Produce un `FraudEvaluation` con `risk_level`, razones (`reasons`) y detalles para auditoría.

5. **Persistencia (MongoDB + Redis)**  
   - MongoDB guarda:
     - Evaluaciones como registro de auditoría inmutable (HU-002)
     - Usuarios y datos de autenticación
     - Configuraciones y reglas personalizadas
   - Redis almacena:
     - Datos de apoyo (ubicaciones históricas, dispositivos conocidos)
     - Configuración activa de umbrales (actualizable sin redespliegue)
     - Patrones de comportamiento (horarios habituales)

6. **Gobernanza y Revisión Manual (FastAPI)**  
   - La API expone endpoints de lectura y revisión:
     - `GET /api/v1/audit/all`, `GET /api/v1/audit/transaction/{id}` para auditoría.  
     - `PUT /api/v1/transactions/review/{id}` para revisión manual por analista (HU-010, requiere header `X-Analyst-Id`).  
     - `GET /api/v1/config/thresholds`, `PUT /api/v1/config/thresholds` para configuración dinámica
   - Estos endpoints son consumidos principalmente por el **Admin Dashboard**.

## 5. Persistencia y Herramientas

- **FastAPI (`services/api-gateway`)**: motor HTTP y adaptador de entrada, con documentación en `http://localhost:8000/docs`.
  - Rutas de autenticación: `/api/v1/auth/*` (register, login, verify-email, me)
  - Rutas de transacciones: `/api/v1/transactions/*` (evaluate, validate, user/{id})
  - Rutas de auditoría: `/api/v1/audit/*` (all, transaction/{id}, user/{id})
  - Rutas de configuración: `/api/v1/config/thresholds`
- **MongoDB**: 
  - Log de auditoría inmutable (colección `evaluations`)
  - Almacenamiento de usuarios (colección `users`)
  - Configuraciones y reglas personalizadas
- **Redis**: 
  - Caché de alta velocidad para perfiles de comportamiento (ubicación, dispositivos)
  - Configuración activa de umbrales (actualizable sin redespliegue)
  - Patrones de horarios y transacciones rápidas
- **RabbitMQ**: 
  - Mensajería asíncrona para desacoplar API y procesamiento pesado
  - Cola de transacciones a evaluar
  - Cola de revisión manual (opcional)

---

Para la organización detallada de carpetas y servicios, ver `docs/PROJECT_STRUCTURE.md` y `docs/MICROSERVICES_ARCHITECTURE.md`.
