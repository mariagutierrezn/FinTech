# 🏦 Frontend Usuario - Simulador de Transacciones

Interfaz de usuario para simular transacciones financieras y visualizar el resultado de la detección de fraude en tiempo real.

## 🚀 Tecnologías

- **React 18.3** - UI Library
- **TypeScript 5.x** - Type Safety
- **Vite 6.x** - Build Tool
- **TailwindCSS 4.x** - Styling
- **Framer Motion 12.x** - Animations
- **Axios** - HTTP Client

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- Backend (API Gateway) corriendo en `http://localhost:8000`

### Pasos

```bash
# 1. Navegar al directorio
cd frontend/user-app

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
copy .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## 🎯 Funcionalidades

### Formulario de Transacción
- Input de monto (validación de número positivo)
- ID de usuario (generado automáticamente)
- Ubicación del usuario
- ID del dispositivo (generado automáticamente)
- Validación en cliente antes de enviar

### Visualización de Resultados
- **APPROVED**: Círculo verde con Risk Score bajo (0-30%)
- **SUSPICIOUS**: Círculo amarillo con Risk Score medio (31-70%)
- **REJECTED**: Círculo rojo con Risk Score alto (71-100%)
- Barra de progreso animada del Risk Score
- Lista de violaciones/alertas detectadas
- Botón para realizar nueva transacción

### Animaciones
- Transiciones suaves entre formulario y resultado
- Animación del círculo de estado
- Barra de progreso con spring animation
- Fade in/out de elementos

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # Botón reutilizable con loading state
│   │   ├── Input.tsx           # Input con label y validación
│   │   └── Card.tsx            # Container con sombra y bordes
│   ├── TransactionForm.tsx     # Formulario principal
│   ├── ResultDisplay.tsx       # Pantalla de resultado
│   └── RiskScoreBar.tsx        # Barra de progreso del score
├── services/
│   └── api.ts                  # Cliente Axios y endpoints
├── types/
│   └── transaction.ts          # Interfaces TypeScript
├── utils/
│   └── formatters.ts           # Helpers (formatCurrency, etc)
├── App.tsx                     # Componente principal
├── main.tsx                    # Entry point
└── index.css                   # TailwindCSS imports
```

## 🎨 Diseño

### Paleta de Colores
- **Primario**: `#4F46E5` (Índigo) - Botones principales
- **Aprobado**: `#10B981` (Verde)
- **Sospechoso**: `#F59E0B` (Ámbar)
- **Rechazado**: `#EF4444` (Rojo)
- **Background**: `#F9FAFB` (Gris muy claro)

### Responsividad
- Mobile-first design
- Optimizado para dispositivos móviles (320px+)
- Layout adaptable hasta desktop

## 🔗 API Integration

### Endpoint Principal
```
POST /api/v1/transaction/validate
```

**Request:**
```json
{
  "amount": 1500.50,
  "userId": "user_12345",
  "location": "New York, USA",
  "deviceId": "mobile_A90B"
}
```

**Response:**
```json
{
  "status": "APPROVED" | "SUSPICIOUS" | "REJECTED",
  "riskScore": 75,
  "violations": ["RuleMontoAlto", "RuleUbicacionInusual"]
}
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor con HMR en puerto 3000

# Producción
npm run build            # Compila TypeScript y crea build optimizado
npm run preview          # Preview del build de producción

# Calidad de Código
npm run lint             # Ejecuta ESLint
```

## 🧪 Testing (Futuro)

```bash
npm run test             # Unit tests con Vitest
npm run test:ui          # Vitest UI
npm run test:e2e         # E2E tests con Playwright
```

## 🚀 Deployment

### Build para Producción

```bash
npm run build
```

El build optimizado se genera en `dist/`.

### Opciones de Hosting
- **Vercel** (Recomendado) - `vercel deploy`
- **Netlify** - `netlify deploy`
- **AWS S3 + CloudFront**
- **Nginx/Caddy** - Servir carpeta `dist/`

## ⚙️ Variables de Entorno

```bash
VITE_API_BASE_URL=http://localhost:8000  # URL del backend
VITE_API_VERSION=v1                      # Versión de la API
VITE_APP_NAME=SecureBank Transfer        # Nombre de la app
```

## 🐛 Troubleshooting

### Puerto 3000 ya en uso
```bash
npm run dev -- --port 3001
```

### Error de CORS
Verificar que el backend tenga CORS habilitado para `http://localhost:3000`

### Dependencias desactualizadas
```bash
npm update
```

## 📄 Licencia

Este proyecto es parte del Fraud Detection Engine.

---

**Creado**: 2026-01-07  
**Autor**: María Gutiérrez
