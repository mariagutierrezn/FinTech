# 🛡️ Fraud Detection Engine

Motor de detección de fraude implementado con **Clean Architecture**, **TDD/BDD**, principios **SOLID** y patrón de diseño **Strategy**.

## 🧪 Cumplimiento TDD/BDD

[![Tests](https://img.shields.io/badge/tests-252%20passed-brightgreen)](docs/TEST_PLAN.md)
[![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)](docs/CODE_COVERAGE_REPORT.md)
[![TDD](https://img.shields.io/badge/TDD-aplicado-blue)](docs/FLUJO_TDD_BDD.md)
[![BDD](https://img.shields.io/badge/BDD-historias%20Gherkin-blue)](docs/USER_HISTORY.md)

### ✅ Verificación Completa (estado actual)

- ✅ **252 tests unitarios backend** pasando (pytest, `tests/unit/`)
- ✅ **2 tests frontend** pasando (Vitest - user-app y admin-dashboard)
- ✅ **Cobertura backend 96%** según `coverage.xml` (umbral mínimo configurado: 70%)
- ✅ **14 historias de usuario** cubiertas con tests unitarios, integración y E2E
- ✅ **Tests escritos antes del código** (TDD)
- ✅ **Ciclo Red-Green-Refactor** documentado
- ✅ **Especificaciones ejecutables** (BDD)
- ✅ **11 módulos con 100% de cobertura** (adaptadores, estrategias, servicios críticos)

📖 **Ver documentación completa (actualizada):**
- `docs/USER_HISTORY.md`: Historias de usuario y flujos de negocio
- `docs/TEST_PLAN.md`: Plan de pruebas y tipos de tests
- `docs/TEST_CASES.md`: Casos de prueba
- `tests-e2e/README.md`: Tests E2E con Playwright

## 🏗️ Arquitectura

### Visión general

- **Backend**:
  - `services/fraud-evaluation-service`: dominio de fraude (estrategias, modelos, casos de uso)
  - `services/api-gateway`: API FastAPI expuesta en `http://localhost:8000`
  - `services/worker-service`: worker asíncrono con RabbitMQ
- **Frontends**:
  - `frontend/user-app`: app de usuario (historial de transacciones)
  - `frontend/admin-dashboard`: dashboard admin (métricas y reglas)
- **Infraestructura**:
  - MongoDB, Redis y RabbitMQ orquestados con `docker-compose.yml`

Para una descripción más detallada ver:
- `docs/PROJECT_STRUCTURE.md`
- `docs/MICROSERVICES_ARCHITECTURE.md`

### Principios SOLID

✅ **0 violaciones SOLID**

- **S** (Single Responsibility): Cada clase tiene una única razón para cambiar
- **O** (Open/Closed): Extensible mediante Strategy Pattern sin modificar código existente
- **L** (Liskov Substitution): Las estrategias son intercambiables
- **I** (Interface Segregation): Interfaces específicas para cada puerto
- **D** (Dependency Inversion): Los casos de uso dependen de abstracciones, no de implementaciones

## 🎯 Historias de Usuario Implementadas

- **HU-001**: API de recepción de transacciones (202 Accepted) - ✅ 5 tests
- **HU-002**: Auditoría de evaluaciones - ✅ 5 tests
- **HU-003**: Regla de umbral de monto (>$1,500) - ✅ 5 tests
- **HU-004**: Validación de dispositivo conocido - ✅ 5 tests
- **HU-005**: Detección de ubicación inusual (>100 km) - ✅ 9 tests
- **HU-006**: Detección de transacciones en cadena - ✅ 5 tests
- **HU-007**: Detección de horario inusual - ✅ 4 tests
- **HU-008**: Modificación de umbrales sin redespliegue - ✅ 3 tests
- **HU-009**: Consulta de configuración actual - ✅ 2 tests
- **HU-010**: Envío a cola de revisión manual - ✅ 5 tests
- **HU-011**: Gestión de reglas personalizadas - ✅ 3 tests
- **HU-012**: Revisión manual por analista - ✅ 5 tests
- **HU-013**: Dashboard usuario (historial transacciones) - ✅ 4 tests
- **HU-014**: Dashboard admin (métricas de fraude) - ✅ 3 tests

**Total:** 14 historias, 252 tests backend + 2 tests frontend, 96% cobertura ✅

📊 **Ver reporte detallado de cobertura:** [`docs/CODE_COVERAGE_REPORT.md`](docs/CODE_COVERAGE_REPORT.md)

## 🚀 Inicio Rápido

### Requisitos Previos

- Python 3.11+
- Docker Desktop (debe estar corriendo)
- Poetry (opcional, para desarrollo local)

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Verificar que Docker Desktop esté corriendo
docker --version

# 2. Levantar todos los servicios
docker-compose up -d

# 3. Verificar que los contenedores estén corriendo
docker-compose ps

# 4. Ver logs
docker-compose logs -f

# 5. Acceder a la API (Swagger UI)
# http://localhost:8000/docs

# 6. Acceder a los frontends (servidos por Nginx en Docker)
# Frontend Usuario: http://localhost:3000
# Frontend Admin: http://localhost:3001

# Iniciar frontend de usuario
cd frontend/user-app
npm install
npm run dev

# Iniciar frontend admin (en otra terminal)
cd frontend/admin-dashboard
npm install
npm run dev
```

### Opción 2: Desarrollo Local (sin Docker para backend)

```bash
# 1. Instalar Poetry
curl -sSL https://install.python-poetry.org | python3 -

# 2. Instalar dependencias backend
poetry install

# 3. Copiar variables de entorno (si aplica)
cp .env.example .env  # o copy en Windows

# 4. Levantar solo las bases de datos con Docker
docker-compose up -d mongodb redis rabbitmq

# 5. Ejecutar API (desde la raíz del repo)
poetry run uvicorn api_gateway.main:app --reload --host 0.0.0.0 --port 8000

# 6. Ejecutar Worker (en otra terminal)
poetry run python -m services.worker-service.src.worker

# 7. Ejecutar frontends en modo dev
cd frontend/user-app && npm install && npm run dev       # http://localhost:5173
cd frontend/admin-dashboard && npm install && npm run dev  # http://localhost:3001
```

## 🧪 Testing

**252 tests backend + 2 tests frontend** | **96% cobertura** | **TDD/BDD aplicado**

```bash
# Ejecutar todos los tests
pytest tests/unit/ -v

# Frontend
cd frontend/user-app && npm test
cd frontend/admin-dashboard && npm test
```

📊 **Cobertura:** 96% (659 líneas, 29 sin cubrir)  
📖 **Detalles:** [`docs/CODE_COVERAGE_REPORT.md`](docs/CODE_COVERAGE_REPORT.md) | [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md)  
🔄 **CI/CD:** Tests automáticos en GitHub Actions

## 📊 Reglas de Fraude

**5 estrategias** implementadas con patrón Strategy:

1. **Amount Threshold** - Monto > $1,500 USD → `HIGH_RISK`
2. **Location Check** - Distancia > 100 km → `HIGH_RISK`
3. **Device Validation** - Dispositivo desconocido → `HIGH_RISK`
4. **Rapid Transaction** - >3 transacciones en 5 min → `HIGH_RISK`
5. **Unusual Time** - Horario fuera del patrón → `MEDIUM/HIGH_RISK`

**Lógica de combinación:**
- **0 violaciones** → `LOW_RISK` → `APPROVED`
- **1 violación** → `MEDIUM_RISK` → `PENDING_REVIEW`
- **2+ violaciones** → `HIGH_RISK` → `REJECTED`

## 🔧 API Endpoints

**Autenticación:** `/api/v1/auth/register`, `/login`, `/verify-email`, `/me`  
**Transacciones:** `/api/v1/transactions/evaluate`, `/validate`, `/user/{id}`  
**Auditoría:** `/api/v1/audit/all`, `/transaction/{id}`, `/user/{id}`  
**Revisión:** `/api/v1/transactions/review/{id}` (requiere `X-Analyst-Id`)  
**Configuración:** `/api/v1/config/thresholds` (GET/PUT)

📖 **Swagger UI:** http://localhost:8000/docs

## 📝 Licencia

MIT License

---

## 📚 Documentación

**Principal:** [Arquitectura](docs/ARQUITECTURE.md) | [Microservicios](docs/MICROSERVICES_ARCHITECTURE.md) | [Estructura](docs/PROJECT_STRUCTURE.md) | [Resumen](docs/OVERVIEW.md)  
**Testing:** [Plan de Pruebas](docs/TEST_PLAN.md) | [Cobertura](docs/CODE_COVERAGE_REPORT.md) | [Casos de Prueba](docs/TEST_CASES.md)  
**Negocio:** [Historias de Usuario](docs/USER_HISTORY.md) | [Contexto](docs/CONTEXTO_NEGOCIO.md) | [TDD/BDD](docs/FLUJO_TDD_BDD.md)  
**Guías:** [Instalación](docs/INSTALL.md) | [Docker](docs/DOCKER_COMPOSE_USAGE.md) | [Seguridad](docs/SECURITY_CONFIGURATION.md)
