# 🏗️ Arquitectura de Servicios - Fraud Detection Engine

Este documento describe la arquitectura **tal como está implementada en el código y en `docker-compose.yml`**, sin elementos “propuestos” que aún no existen.

---

## 📁 Módulos Principales

- **`services/fraud-evaluation-service`**
  - Implementa la lógica de negocio de fraude:
    - Modelos de dominio (`Transaction`, `FraudEvaluation`, `Location`, etc.).
    - Estrategias (`amount_threshold`, `location_check`, `rapid_transaction`, `unusual_time`, `device_validation`, etc.).
    - Casos de uso para evaluar y revisar transacciones.

- **`services/api-gateway`**
  - Servicio FastAPI que expone la API REST pública en `http://localhost:8000`.
  - Se encarga de:
    - **Autenticación y Autorización:**
      - Registro de usuarios (`POST /api/v1/auth/register`)
      - Login con JWT (`POST /api/v1/auth/login`)
      - Verificación de email (`POST /api/v1/auth/verify-email`)
      - Obtener usuario actual (`GET /api/v1/auth/me`)
      - Validación de tokens JWT en endpoints protegidos
    - Recibir requests HTTP (requieren autenticación para transacciones).
    - Orquestar casos de uso de evaluación y revisión.
    - Exponer endpoints de configuración y auditoría.

- **`services/worker-service`**
  - Worker que procesa mensajes en segundo plano vía RabbitMQ.
  - Aplica estrategias de fraude y persiste los resultados.

- **Frontends**
  - `frontend/user-app`: app de usuario (historial de transacciones).
  - `frontend/admin-dashboard`: dashboard admin (métricas y reglas).

---

## 🔄 Flujo de Alto Nivel

```text
Cliente (User App / Admin Dashboard / API client)
        │
        │ 1) Autenticación: POST /api/v1/auth/login
        │    → Recibe token JWT
        │
        │ 2) HTTP con Authorization: Bearer <token>
        ▼
┌──────────────────────┐
│      API Gateway     │  (FastAPI, puerto 8000)
│  - Autenticación     │  - /api/v1/auth/*
│  - Validación JWT    │  - /api/v1/transactions/*
│  - Endpoints públicos│  - /api/v1/audit/*
└─────────┬────────────┘
          │
          │ 3) Publica mensajes de evaluación
          ▼
   ┌───────────────┐
   │   RabbitMQ    │
   └──────┬────────┘
          │
          │ 4) Worker consume mensajes
          ▼
┌─────────────────────────────┐
│     Worker Service          │
│   (fraud-evaluation core)   │
└─────────┬───────────────────┘
          │
          │ 5) Usa 5 estrategias de fraude
          ▼
┌─────────────────────────────┐
│ Fraud Evaluation Service    │
│ (domain + application)      │
│ - AmountThresholdStrategy   │
│ - LocationStrategy          │
│ - DeviceValidationStrategy  │
│ - RapidTransactionStrategy  │
│ - UnusualTimeStrategy       │
└─────────┬─────────┬────────┘
          │         │
          │         │
          ▼         ▼
     ┌────────┐  ┌────────┐
     │MongoDB │  │ Redis  │
     │- Users │  │- Cache │
     │- Evals │  │- Config│
     └────────┘  └────────┘
```

- **MongoDB**: almacena:
  - Evaluaciones y auditoría inmutable (colección `evaluations`)
  - Usuarios y datos de autenticación (colección `users`)
  - Configuraciones y reglas personalizadas
- **Redis**: guarda caché de:
  - Ubicaciones históricas de usuarios
  - Dispositivos conocidos por usuario
  - Umbrales y configuración activa (actualizable sin redespliegue)
  - Patrones de comportamiento (horarios habituales, transacciones rápidas)

---

## 🐳 Servicios en `docker-compose.yml`

El archivo `docker-compose.yml` define los servicios reales que se levantan:

1. **`mongodb`**
   - Imagen: `mongo:7.0`
   - Puerto: `27017`
   - Uso: base de datos principal para evaluaciones y usuarios.

2. **`redis`**
   - Imagen: `redis:7.2-alpine`
   - Puerto: `6379`
   - Uso: caché para ubicaciones, dispositivos, configuración.

3. **`rabbitmq`**
   - Imagen: `rabbitmq:3.12-management-alpine`
   - Puertos:
     - `5672`: AMQP
     - `15672`: UI de administración

4. **`api`**
   - Construido desde `services/api-gateway/Dockerfile`.
   - Expone `http://localhost:8000`.

5. **`worker`**
   - Construido desde `services/worker-service/Dockerfile`.
   - No expone puerto público; se comunica con RabbitMQ/MongoDB/Redis.

6. **`frontend-user`**
   - Construido desde `frontend/user-app/Dockerfile`.
   - Servido por Nginx en `http://localhost:3000`.

7. **`frontend-admin`**
   - Construido desde `frontend/admin-dashboard/Dockerfile`.
   - Servido por Nginx en `http://localhost:3001`.

No se usan actualmente archivos `docker-compose.dev.yml` ni `docker-compose.prod.yml`; cualquier mención en documentos antiguos es legacy.

---

## 🔐 Seguridad y Autenticación

### Sistema de Autenticación Implementado

El sistema incluye autenticación completa con JWT:

1. **Registro de Usuario** (`POST /api/v1/auth/register`):
   - Crea cuenta con email, contraseña hasheada (bcrypt)
   - Genera token de verificación de email
   - Envía correo de verificación
   - Usuario queda en estado `is_verified=false`

2. **Verificación de Email** (`POST /api/v1/auth/verify-email`):
   - Valida token de verificación
   - Marca usuario como `is_verified=true`
   - Envía correo de bienvenida

3. **Login** (`POST /api/v1/auth/login`):
   - Valida credenciales (user_id, password)
   - Verifica que usuario esté activo (`is_active=true`)
   - Verifica que email esté verificado (`is_verified=true`)
   - Genera token JWT con expiración configurable
   - Retorna: `access_token`, `token_type`, `user_id`, `email`, `full_name`

4. **Autorización**:
   - Endpoints protegidos requieren header: `Authorization: Bearer <token>`
   - Dependency `get_current_user_from_token` valida JWT
   - Usuarios solo pueden ver sus propias transacciones
   - Administradores tienen acceso completo

### Configuración de Seguridad

- Las URLs de servicios se leen desde variables de entorno, configuradas en `docker-compose.yml` y en `src/config.py`.
- **Contraseñas**: Se almacenan hasheadas con bcrypt (nunca en texto plano)
- **Tokens JWT**: Configurables con secret key y tiempo de expiración
- **Credenciales de ejemplo** (`admin/fraud2026`, etc.) están pensadas **solo para desarrollo local**.
- Para producción se recomienda:
  - Variables de entorno seguras / secretos (por ejemplo, Key Vault, Azure Key Vault)
  - TLS terminado en un reverse proxy o gateway de API externo
  - Rotación de secret keys JWT
  - Rate limiting en endpoints de autenticación

---

## 📈 Observabilidad y Salud

- **Health check**:
  - `GET /health` en el API Gateway.
- **Logs**:
  - Cada contenedor escribe a `stdout`/`stderr` y se consulta con `docker-compose logs`.
- **RabbitMQ**:
  - UI de administración en `http://localhost:15672` (`fraud` / `fraud2026` para desarrollo).

---

## ✅ Resumen

- La arquitectura implementada es **orientada a servicios**, con:
  - Un API Gateway FastAPI.
  - Un “núcleo” de evaluación de fraude desacoplado (dominio + casos de uso).
  - Un worker asíncrono para procesar colas.
  - Frontends independientes (user/admin) hablando con la API.
- Toda la infraestructura necesaria para desarrollo local se levanta con **un solo comando**:

```bash
docker-compose up -d
```

Para más detalles de carpetas y archivos, ver también `docs/PROJECT_STRUCTURE.md`.
