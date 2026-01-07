# 🖥️ Frontend Admin - Dashboard de Riesgo

Panel de administración para monitorear y gestionar el sistema de detección de fraude.

## 🚀 Tecnologías

- **React 18.3** - UI Library
- **TypeScript 5.x** - Type Safety
- **Vite 6.x** - Build Tool
- **TailwindCSS 4.x** - Styling (Dark Mode)
- **React Router 7.x** - Routing
- **Recharts 2.x** - Data Visualization
- **TanStack Table 8.x** - Table Management
- **Zustand 5.x** - State Management
- **React Hot Toast** - Notifications
- **Axios** - HTTP Client

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- Backend (API Gateway) corriendo en `http://localhost:8000`

### Pasos

```bash
# 1. Navegar al directorio
cd frontend/admin-dashboard

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
copy .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:3001`

## 🎯 Funcionalidades

### Dashboard Principal
- **KPI Cards**: 
  - Total de transacciones
  - % de transacciones bloqueadas
  - % en revisión manual
  - Risk Score promedio
- **Gráfico de Tendencias**: Línea de tiempo de las últimas 24h
- **Transacciones Recientes**: Tabla con últimas 10 transacciones

### Gestión de Reglas
- **Lista de Reglas Activas**: Visualización de todas las reglas configuradas
- **Edición de Parámetros**: Modal para modificar umbrales sin redespliegue
- **Tipos de Reglas**:
  - Amount Threshold (Umbral de monto)
  - Location Check (Verificación de ubicación)

### Log de Transacciones
- **Tabla Completa**: Todas las transacciones con paginación
- **Filtros**:
  - Por estado (APPROVED, SUSPICIOUS, REJECTED)
  - Por fecha
  - Por usuario
- **Columnas**:
  - ID de transacción
  - Monto
  - Usuario
  - Fecha/Hora
  - Estado (con color coding)
  - Violaciones detectadas

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── dashboard/
│   │   ├── KPICard.tsx         # Widget de KPI
│   │   └── TrendChart.tsx      # Gráfico de líneas
│   └── Layout.tsx              # Layout principal con navegación
├── pages/
│   ├── Dashboard.tsx           # Página principal
│   ├── RulesPage.tsx           # Gestión de reglas
│   └── TransactionsPage.tsx    # Log de transacciones
├── services/
│   └── api.ts                  # Cliente Axios y endpoints
├── types/
│   └── index.ts                # Interfaces TypeScript
├── App.tsx                     # Componente principal con router
├── main.tsx                    # Entry point
└── index.css                   # TailwindCSS imports
```

## 🎨 Diseño

### Paleta de Colores (Dark Mode)
- **Background**: `#1F2937` (admin-bg)
- **Surface**: `#374151` (admin-surface)
- **Primario**: `#6366F1` (Índigo claro)
- **Aprobado**: `#10B981` (Verde)
- **Sospechoso**: `#FBBF24` (Ámbar)
- **Rechazado**: `#F87171` (Rojo)

### Responsividad
- Optimizado para desktop (1024px+)
- Layout adaptable para tablet (768px+)

## 🔗 API Integration

### Endpoints Principales

**GET /api/v1/admin/rules** - Lista reglas activas

**PUT /api/v1/admin/rules/{ruleId}** - Actualiza regla
```json
{
  "parameters": { "threshold": 2000 }
}
```

**GET /api/v1/admin/transactions/log** - Log de transacciones
Query params: `?status=SUSPICIOUS&limit=100`

**GET /api/v1/admin/metrics** - KPIs del sistema

**POST /api/v1/admin/rules/reorder** - Reordena reglas

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor con HMR en puerto 3001

# Producción
npm run build            # Compila TypeScript y crea build optimizado
npm run preview          # Preview del build de producción

# Calidad de Código
npm run lint             # Ejecuta ESLint
```

## 🚀 Deployment

### Build para Producción

```bash
npm run build
```

El build optimizado se genera en `dist/`.

### Opciones de Hosting
- **Vercel** con autenticación
- **Netlify** con Netlify Identity
- **AWS Amplify** con Cognito
- **Self-hosted** en Nginx/Caddy con Basic Auth

## ⚙️ Variables de Entorno

```bash
VITE_API_BASE_URL=http://localhost:8000  # URL del backend
VITE_API_VERSION=v1                      # Versión de la API
VITE_APP_NAME=Fraud Detection Admin      # Nombre de la app
VITE_ANALYST_ID=analyst_demo             # ID del analista (desarrollo)
```

## 🔐 Seguridad

- **Header X-Analyst-ID**: Se envía en todas las peticiones de modificación
- **En Producción**: Implementar autenticación real (JWT, OAuth)
- **Rate Limiting**: Implementar en el backend
- **CORS**: Configurar orígenes permitidos

## 🐛 Troubleshooting

### Puerto 3001 ya en uso
```bash
npm run dev -- --port 3002
```

### Error de CORS
Verificar que el backend tenga CORS habilitado para `http://localhost:3001`

## 📄 Licencia

Este proyecto es parte del Fraud Detection Engine.

---

**Creado**: 2026-01-07  
**Autor**: María Gutiérrez
