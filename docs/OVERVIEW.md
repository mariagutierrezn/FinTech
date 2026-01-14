## 🧾 Resumen Conceptual del Proyecto


## 🎯 Objetivo del Fraud Detection Engine

- Detectar transacciones potencialmente fraudulentas usando un **conjunto de reglas de negocio** (estrategias de fraude).
- Mantener una **arquitectura limpia y testeable**:
  - Separar la lógica de negocio de la infraestructura.
  - Facilitar cambios en reglas sin romper todo el sistema.
- Ofrecer:
  - **API REST** para otros sistemas.
  - **UIs** para usuarios finales y analistas.
  - **Trazabilidad** completa de las decisiones (auditoría).

---

## 🏗️ Piezas Principales (visión rápida)

- **Backend (Python)**:
  - `services/fraud-evaluation-service`: núcleo de negocio de fraude (reglas, modelos, casos de uso).
  - `services/api-gateway`: API FastAPI pública.
  - `services/worker-service`: worker asíncrono que procesa colas de RabbitMQ.
- **Frontends (React/Vite)**:
  - `frontend/user-app`: aplicación de usuario para ver transacciones e historial.
  - `frontend/admin-dashboard`: dashboard de analista/admin para métricas y revisión manual.
- **Infraestructura**:
  - `docker-compose.yml`: define MongoDB, Redis, RabbitMQ, API, worker y frontends.
- **Tests**:
  - `tests/`: tests unitarios/integración backend (pytest).
  - `tests-e2e/`: tests end-to-end (Playwright).
- **Documentación**:
  - `docs/*.md`: arquitectura, estructura, historias de usuario, plan de pruebas, etc.

---

## 🧱 Backend – Servicios

### 1. `services/fraud-evaluation-service`

- **Qué es**: el **núcleo de negocio** del motor de fraude.
- **Qué contiene**:
  - `domain/`:
    - **Entidades**: `Transaction`, `FraudEvaluation`, `Location`, `RiskLevel`, etc.
    - **Estrategias de fraude** (5 estrategias, todas con 100% cobertura):
      - `amount_threshold.py`: regla por monto (>$1,500 → HIGH_RISK).
      - `location_check.py`: regla por distancia geográfica (Haversine, >100km → HIGH_RISK).
      - `device_validation.py`: dispositivo conocido vs nuevo (nuevo → HIGH_RISK).
      - `rapid_transaction.py`: muchas transacciones en poco tiempo (>3 en 5min → HIGH_RISK).
      - `unusual_time.py`: horarios inusuales para el usuario (análisis de patrón histórico).
  - `application/`:
    - Casos de uso:
      - `EvaluateTransactionUseCase`: evalúa una transacción aplicando todas las estrategias.
      - `ReviewTransactionUseCase`: permite al analista modificar la decisión.
    - Interfaces/puertos:
      - Repositorios, cache, mensajería.
  - `adapters.py`, `config.py`: adaptadores a MongoDB, Redis, RabbitMQ y configuración.
- **Por qué es importante**:
  - Aquí vive la lógica de negocio pura y las reglas que justifican el proyecto.

### 2. `services/api-gateway`

- **Qué es**: una **API REST** implementada con FastAPI.
- **Responsabilidad**:
  - Recibir peticiones HTTP de clientes y frontends.
  - Exponer endpoints como:
    - **Autenticación**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-email`
    - **Transacciones**: `POST /api/v1/transactions/evaluate`, `GET /api/v1/transactions/user/{user_id}`
    - **Auditoría**: `GET /api/v1/audit/all`, `GET /api/v1/audit/transaction/{id}`, `GET /api/v1/audit/user/{user_id}`
    - **Revisión Manual**: `PUT /api/v1/transactions/review/{id}` (requiere header `X-Analyst-Id`)
    - **Configuración**: `GET /api/v1/config/thresholds`, `PUT /api/v1/config/thresholds`
    - **Health**: `GET /health`, `GET /` (redirige a /docs)
  - Hacer **dependency injection** de los adaptadores y casos de uso del núcleo.
- **Archivo clave**:
  - `src/main.py`: crea la app FastAPI y monta las rutas.

### 3. `services/worker-service`

- **Qué es**: un **worker asíncrono** que procesa mensajes de RabbitMQ.
- **Responsabilidad**:
  - Leer mensajes con transacciones pendientes de evaluación.
  - Construir entidades `Transaction`.
  - Invocar `EvaluateTransactionUseCase`.
  - Guardar resultados en MongoDB y actualizar datos de apoyo en Redis.
- **Por qué existe**:
  - Permite que la API responda rápido (`202 Accepted`) sin bloquearse por la evaluación.

---

## 🌐 Frontends

### 1. `frontend/user-app`

- **Público objetivo**: usuario final del sistema (cliente bancario, por ejemplo).
- **Tecnologías**:
  - React + Vite + TypeScript + TailwindCSS.
- **Funciones principales**:
  - **Autenticación**: registro, login, verificación de email
  - Ver **historial de transacciones** del usuario
  - Ver el **estado de riesgo** de cada transacción (aprobada, sospechosa, rechazada)
  - **Notificaciones en tiempo real** cuando transacciones son revisadas por analistas
  - Realizar nuevas transacciones con validación en tiempo real
- **Cómo se conecta**:
  - Llama a la API del Gateway (por ejemplo, endpoints de consulta de auditoría o transacciones por usuario).

### 2. `frontend/admin-dashboard`

- **Público objetivo**: analistas de fraude y administradores.
- **Tecnologías**:
  - React + Vite + TypeScript + TailwindCSS.
  - Recharts (gráficas), TanStack Table (tablas).
- **Funciones principales**:
  - Ver **métricas de fraude** (HIGH/MEDIUM/LOW, volumen por día, tasas de aprobación/rechazo)
  - Navegar la **auditoría** de evaluaciones con filtros y búsqueda
  - Hacer **revisión manual** de transacciones de riesgo (aprobar/rechazar con justificación)
  - Consultar y actualizar **configuración/umbrales** dinámicamente sin redespliegue
  - Ver detalles completos de cada transacción (estrategias aplicadas, razones, timestamps)

---

## 🗄️ Infraestructura – `docker-compose.yml`

- **Objetivo**: levantar todo el entorno local con un solo comando:

```bash
docker-compose up -d
```

- **Servicios definidos**:
  - `mongodb` – base de datos principal (27017).
  - `redis` – caché de alta velocidad (6379).
  - `rabbitmq` – broker de mensajería (5672, 15672).
  - `api` – API Gateway (FastAPI, puerto 8000).
  - `worker` – worker asíncrono.
  - `frontend-user` – User App servida por Nginx (puerto 3000).
  - `frontend-admin` – Admin Dashboard servido por Nginx (puerto 3001).
- **Idea clave**:
  - Simular el entorno completo de producción en tu máquina local con una sola herramienta (Docker Compose).

---

## 🔁 Flujo de una Transacción (de extremo a extremo)

1. **Cliente (User App / sistema externo)** envía la transacción:
   - `POST /transaction` al API Gateway.
2. **API Gateway (FastAPI)**:
   - Valida el request.
   - Publica un mensaje en RabbitMQ.
   - Devuelve `202 Accepted` rápidamente.
3. **RabbitMQ**:
   - Coloca la transacción en una cola de evaluación.
4. **Worker Service**:
   - Lee el mensaje.
   - Crea una `Transaction`.
   - Ejecuta `EvaluateTransactionUseCase` (núcleo de fraude).
5. **Fraud Evaluation Service**:
   - Aplica todas las 5 estrategias de fraude en paralelo.
   - Combina resultados: 0 violaciones → LOW_RISK, 1 → MEDIUM_RISK, 2+ → HIGH_RISK.
   - Calcula un `FraudEvaluation` (nivel de riesgo + razones + estrategias aplicadas).
6. **Persistencia**:
   - Guarda el resultado en MongoDB (para auditoría).
   - Actualiza Redis (por ejemplo, historial de ubicación, dispositivos).
7. **Consulta y revisión**:
   - Admin Dashboard llama a endpoints como:
     - `GET /audit/all`, `GET /audit/transaction/{id}` para ver resultados.
     - `PUT /transaction/review/{id}` para revisión manual.

---

## 🧪 Testing y Calidad

- **Backend (pytest)**:
  - `tests/unit/`: **252 tests unitarios** cubriendo:
    - 5 estrategias de fraude (100% cobertura cada una)
    - Adaptadores de infraestructura (MongoDB, Redis, RabbitMQ - 100% cobertura)
    - Casos de uso (100% cobertura)
    - Modelos de dominio (95% cobertura)
    - Rutas API (25 tests)
    - Worker service (25 tests)
    - Servicios de autenticación (100% cobertura)
  - **Cobertura: 96%** (659 líneas, 29 sin cubrir)
  - **11 módulos con 100% de cobertura**
- **Frontends (Vitest)**:
  - `frontend/user-app`: 1 test pasando
  - `frontend/admin-dashboard`: 1 test pasando
- **E2E (Playwright)**:
  - `tests-e2e/`: cubre historias de usuario completas (User App + Admin Dashboard + API).
- **Documentos clave**:
  - `docs/TEST_PLAN.md`: qué tipos de tests existen y cómo se ejecutan.
  - `docs/TEST_CASES.md`: casos de prueba específicos.
  - `docs/CODE_COVERAGE_REPORT.md`: análisis detallado de cobertura de código.

---

## 📚 Documentación Relacionada

- `docs/ARQUITECTURE.md`  
  Explica las **capas lógicas** (Domain/Application/Infrastructure) y el flujo asíncrono con RabbitMQ, MongoDB y Redis.

- `docs/PROJECT_STRUCTURE.md`  
  Explica **dónde está cada cosa** en el repositorio (carpetas y archivos).

- `docs/MICROSERVICES_ARCHITECTURE.md`  
  Describe cómo se relacionan los servicios (API, worker, núcleo de fraude) y qué servicios levanta Docker Compose.

- `docs/USER_HISTORY.md`  
  Lista detallada de **historias de usuario** y contexto de negocio.

- `docs/INSTALL.md`  
  Pasos para instalar, levantar y probar el proyecto en local.

- `docs/CODE_COVERAGE_REPORT.md`  
  Análisis detallado de cobertura de código (96%), módulos con 100%, y recomendaciones de mejora.

---

## 💡 Cómo usar este archivo en tu presentación

- Como referencia rápida para:
  - Explicar **qué hace cada carpeta/servicio** sin entrar al código.
  - Conectar la parte técnica (código) con la parte funcional (historias de usuario).
- Puedes copiar secciones enteras como:
  - “Backend – Servicios” (para explicar arquitectura de backend).
  - “Frontends” (para enseñar las UIs).
  - “Flujo de una transacción” (para un diagrama de alto nivel).
  - “Testing y calidad” (para justificar la robustez del sistema).


