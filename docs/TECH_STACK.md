# 🛠️ Stack Tecnológico Recomendado - Frontend

## 🎯 Resumen Ejecutivo

### Frontend Usuario (Simulador)
**Stack Principal**: React + Vite + TypeScript + TailwindCSS  
**Propósito**: Experiencia móvil-first, rápida y elegante para usuarios finales.

### Frontend Admin (Dashboard)
**Stack Principal**: React + Vite + TypeScript + TailwindCSS + Recharts  
**Propósito**: Panel de administración robusto, con énfasis en visualización de datos.

---

## 📦 Dependencias Core

### Ambos Frontends (Compartidas)

#### 1. **React 18.3+**
- **Razón**: Library líder en el mercado, ecosistema maduro, performance excelente
- **Alternativas consideradas**: Vue.js, Svelte
- **Por qué React**: Mayor comunidad, mejor integración con TypeScript, más recursos

#### 2. **Vite 6.x**
- **Razón**: Build tool ultra-rápido, HMR instantáneo, ESM nativo
- **Ventajas sobre CRA**: 10-100x más rápido en dev, bundle optimizado
- **Configuración**: Zero-config para React + TypeScript

#### 3. **TypeScript 5.x**
- **Razón**: Type safety, mejor DX, prevención de bugs en producción
- **Modo**: Strict mode habilitado (`"strict": true`)
- **Beneficio**: Autocompletado robusto en IDEs

#### 4. **TailwindCSS 4.x**
- **Razón**: Utility-first CSS, diseño consistente, performance (PurgeCSS)
- **Plugins**:
  - `@tailwindcss/forms`: Estilos de formularios
  - `@tailwindcss/typography`: Tipografía
- **Ventajas**: Dark mode built-in, responsive design simple

#### 5. **React Router 7.x**
- **Razón**: Routing estándar de facto en React
- **Funcionalidades**:
  - Lazy loading de rutas
  - Protected routes (para admin)
  - History mode

---

## 🧩 Librerías Específicas por Frontend

### Frontend Usuario (Simulador)

#### UI Components
1. **Headless UI** (`@headlessui/react`)
   - Componentes accesibles sin estilos
   - Ideal para modals, transitions, focus management
   - Totalmente compatible con TailwindCSS

2. **React Hook Form** (`react-hook-form`)
   - Gestión de formularios performante
   - Validación integrada con Zod
   - Re-renders mínimos

3. **Zod** (`zod`)
   - Schema validation
   - TypeScript-first
   - Integración perfecta con React Hook Form

#### Animaciones
4. **Framer Motion** (`framer-motion`)
   - Animaciones declarativas
   - Transiciones de estado APPROVED/SUSPICIOUS/REJECTED
   - Spring animations para feel natural

#### HTTP Client
5. **Axios** (`axios`)
   - Cliente HTTP con interceptors
   - Manejo de errores centralizado
   - Request/response transformation

#### Iconos
6. **Heroicons** (`@heroicons/react`)
   - Iconos SVG optimizados
   - Diseñados por creadores de TailwindCSS
   - Tree-shakeable

#### Estado Global (opcional)
7. **Zustand** (`zustand`)
   - State management minimalista
   - API simple (sin boilerplate)
   - Solo si se necesita compartir estado entre rutas

---

### Frontend Admin (Dashboard)

#### Todas las del Frontend Usuario +

#### Visualización de Datos
1. **Recharts** (`recharts`)
   - Library de charts declarativa para React
   - Composable, fácil de customizar
   - Performance: Virtual rendering
   - Tipos de gráficos: Line, Bar, Area, Pie

2. **TanStack Table (v8)** (`@tanstack/react-table`)
   - Headless table library
   - Sorting, filtering, pagination built-in
   - Virtualización para tablas grandes (1000+ rows)
   - TypeScript-first

#### Drag & Drop
3. **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`)
   - Modern drag & drop toolkit
   - Accesible (keyboard support)
   - Touch-friendly
   - Para reordenar reglas en Chain of Responsibility

#### Date & Time
4. **date-fns** (`date-fns`)
   - Utilidades de fecha/hora
   - Tree-shakeable (importar solo lo necesario)
   - Más ligero que Moment.js

#### Notificaciones
5. **React Hot Toast** (`react-hot-toast`)
   - Toast notifications elegantes
   - Altamente customizable
   - Animaciones suaves

---

## 📊 Comparativa de Alternativas

### State Management

| Librería | Pros | Contras | Recomendación |
|----------|------|---------|---------------|
| **Zustand** | Simple, sin boilerplate, 1KB | Menos features que Redux | ✅ **Elegido** |
| Redux Toolkit | Ecosystem maduro, DevTools | Verboso, curva de aprendizaje | ❌ Overkill |
| Jotai | Atomic, React Suspense | Más nuevo, menos recursos | ⚠️ Alternativa |

### Visualización de Datos

| Librería | Pros | Contras | Recomendación |
|----------|------|---------|---------------|
| **Recharts** | Declarativo, fácil, React-first | Menos charts que D3 | ✅ **Elegido** |
| Chart.js | Muy popular, muchos ejemplos | Imperativo, no declarativo | ❌ |
| Victory | Animaciones ricas | Bundle más grande | ⚠️ Si necesitas más animaciones |
| D3.js | Máxima flexibilidad | Curva de aprendizaje empinada | ❌ |

### Styling

| Librería | Pros | Contras | Recomendación |
|----------|------|---------|---------------|
| **TailwindCSS** | Utility-first, consistente, DX | HTML verbose | ✅ **Elegido** |
| CSS Modules | Scoped CSS, estándar | Requiere más setup | ❌ |
| Styled Components | CSS-in-JS, dynamic styles | Runtime cost | ❌ |
| Emotion | Mejor performance que SC | Sintaxis menos familiar | ❌ |

---

## 🏗️ Estructura de Proyecto

### Frontend Usuario (Simulador)

```
frontend/user-app/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── ui/                    # Componentes reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   ├── TransactionForm.tsx
│   │   ├── ResultDisplay.tsx
│   │   └── RiskScoreBar.tsx
│   ├── hooks/
│   │   ├── useTransaction.ts      # Hook para submit transaction
│   │   └── useFormValidation.ts
│   ├── services/
│   │   └── api.ts                 # Axios instance + endpoints
│   ├── types/
│   │   └── transaction.ts         # TypeScript interfaces
│   ├── utils/
│   │   └── formatters.ts          # Helpers (formatCurrency, etc)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # TailwindCSS imports
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

### Frontend Admin (Dashboard)

```
frontend/admin-dashboard/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/                    # Componentes reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Badge.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── RecentTransactions.tsx
│   │   ├── rules/
│   │   │   ├── RulesList.tsx
│   │   │   ├── RuleCard.tsx
│   │   │   ├── RuleModal.tsx
│   │   │   └── DraggableRule.tsx
│   │   └── transactions/
│   │       ├── TransactionsTable.tsx
│   │       ├── TransactionFilters.tsx
│   │       └── SuspiciousQueue.tsx
│   ├── hooks/
│   │   ├── useRules.ts
│   │   ├── useTransactions.ts
│   │   └── useMetrics.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── RulesPage.tsx
│   │   └── TransactionsPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── admin-api.ts           # Admin-specific endpoints
│   ├── store/
│   │   └── useStore.ts            # Zustand store
│   ├── types/
│   │   ├── rule.ts
│   │   ├── transaction.ts
│   │   └── metrics.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 📝 package.json Recomendados

### Frontend Usuario

```json
{
  "name": "fraud-detection-user-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.0.2",
    "axios": "^1.7.9",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",
    "framer-motion": "^12.0.1",
    "@headlessui/react": "^2.2.0",
    "@heroicons/react": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.18.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
```

### Frontend Admin

```json
{
  "name": "fraud-detection-admin-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.0.2",
    "axios": "^1.7.9",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",
    "framer-motion": "^12.0.1",
    "@headlessui/react": "^2.2.0",
    "@heroicons/react": "^2.2.0",
    "recharts": "^2.15.0",
    "@tanstack/react-table": "^8.20.6",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^9.0.0",
    "date-fns": "^4.1.0",
    "react-hot-toast": "^2.4.1",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.18.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
```

---

## ⚙️ Configuraciones Clave

### vite.config.ts (Ambos)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // User: 3000, Admin: 3001
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // FastAPI backend
        changeOrigin: true,
      },
    },
  },
})
```

### tailwind.config.js (Ambos)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Frontend Usuario (Light)
        'user-primary': '#4F46E5',
        'user-approved': '#10B981',
        'user-warning': '#F59E0B',
        'user-error': '#EF4444',
        
        // Frontend Admin (Dark)
        'admin-bg': '#1F2937',
        'admin-surface': '#374151',
        'admin-primary': '#6366F1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class', // Admin usa dark mode
}
```

### tsconfig.json (Ambos)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 🚀 Comandos de Instalación

### Crear Frontend Usuario

```bash
# Crear proyecto con Vite
npm create vite@latest frontend/user-app -- --template react-ts
cd frontend/user-app

# Instalar dependencias principales
npm install react-router-dom axios react-hook-form zod @hookform/resolvers

# Instalar UI y animaciones
npm install framer-motion @headlessui/react @heroicons/react

# Instalar TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Inicializar TailwindCSS
# (Configurar tailwind.config.js como arriba)

# Iniciar dev server
npm run dev
```

### Crear Frontend Admin

```bash
# Crear proyecto con Vite
npm create vite@latest frontend/admin-dashboard -- --template react-ts
cd frontend/admin-dashboard

# Instalar dependencias principales
npm install react-router-dom axios react-hook-form zod @hookform/resolvers

# Instalar UI y animaciones
npm install framer-motion @headlessui/react @heroicons/react

# Instalar visualización de datos
npm install recharts @tanstack/react-table

# Instalar drag & drop
npm install @dnd-kit/core @dnd-kit/sortable

# Instalar utilidades
npm install date-fns react-hot-toast zustand

# Instalar TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Iniciar dev server (en puerto 3001)
npm run dev -- --port 3001
```

---

## 🔐 Variables de Entorno

### .env.example (Frontend Usuario)

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
VITE_APP_NAME=SecureBank Transfer
```

### .env.example (Frontend Admin)

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
VITE_APP_NAME=Fraud Detection Admin
VITE_ANALYST_ID=analyst_demo # Para desarrollo
```

---

## 📈 Métricas de Performance

### Targets

| Métrica | Target | Herramienta |
|---------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.5s | Lighthouse |
| **Largest Contentful Paint (LCP)** | < 2.5s | Lighthouse |
| **Time to Interactive (TTI)** | < 3.5s | Lighthouse |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse |
| **Bundle Size (gzip)** | < 250KB | Vite Bundle Analyzer |

### Optimizaciones

1. **Code Splitting**: Lazy load de rutas con `React.lazy()`
2. **Tree Shaking**: Vite lo hace automáticamente
3. **Image Optimization**: WebP + lazy loading
4. **Caching**: Service Workers con Workbox (opcional)
5. **CDN**: Considerar Cloudflare/Vercel para assets estáticos

---

## 🧪 Testing (Opcional pero Recomendado)

### Testing Stack

```bash
# Unit & Integration Tests
npm install -D vitest @testing-library/react @testing-library/jest-dom

# E2E Tests
npm install -D playwright @playwright/test

# Coverage
npm install -D @vitest/coverage-v8
```

### Scripts de Testing

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test"
}
```

---

## 📦 Deployment

### Opciones de Hosting

#### Frontend Usuario
1. **Vercel** (Recomendado) - Zero-config, CI/CD automático
2. **Netlify** - Similar a Vercel
3. **Cloudflare Pages** - Performance excelente

#### Frontend Admin
1. **Vercel** con autenticación (Vercel Auth)
2. **AWS Amplify** - Integración con Cognito
3. **Self-hosted** en Nginx/Caddy

### Build Commands

```bash
# Producción
npm run build

# Salida en: dist/
# Servir con: npx serve dist
```

---

## 🔄 Integración con Backend

### API Service (src/services/api.ts)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo global de errores
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial
- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Recharts Examples](https://recharts.org/en-US/examples)

### Tutoriales Recomendados
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TailwindCSS + React Setup](https://tailwindcss.com/docs/guides/vite)
- [TanStack Table Guide](https://tanstack.com/table/latest/docs/introduction)

---

**Documento creado**: 2026-01-07  
**Autor**: María Gutiérrez (con asistencia de GitHub Copilot)  
**Versión**: 1.0
