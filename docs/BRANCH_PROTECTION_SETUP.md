# Instrucciones para Configurar Protección de Ramas en GitHub

**HUMAN REVIEW (Maria Paula Gutierrez):**  
Estas son las instrucciones paso a paso para configurar las reglas de protección de ramas en GitHub.

---

## 🔒 Configurar Protección para `main`

### Paso 1: Ir a Settings
1. En GitHub, ve a tu repositorio
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Branches** (Ramas)

### Paso 2: Agregar Regla para `main`
1. Click en **Add branch protection rule**
2. En **Branch name pattern**, escribe: `main`

### Paso 3: Activar las siguientes opciones:

- [x] **Require a pull request before merging**
  - [x] **Require approvals**: 2
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  
- [x] **Require status checks to pass before merging**
  - [x] **Require branches to be up to date before merging**
  - Buscar y agregar: `test` (nombre del job en CI)
  
- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**

- [ ] **Allow force pushes** (dejar DESMARCADO)

- [ ] **Allow deletions** (dejar DESMARCADO)

### Paso 4: Click en **Create** o **Save changes**

---

## 🔒 Configurar Protección para `develop`

### Repetir el proceso:
1. Click en **Add branch protection rule**
2. En **Branch name pattern**, escribe: `develop`

### Activar las mismas opciones que `main`:

- [x] **Require a pull request before merging**
  - [x] **Require approvals**: 2
  
- [x] **Require status checks to pass before merging**
  - [x] **Require branches to be up to date before merging**
  - Agregar: `test`
  
- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**

### Click en **Create**

---

## ✅ Verificación

Para verificar que funcionó:

1. Intenta hacer push directo a `main`:
```bash
git checkout main
git commit --allow-empty -m "test"
git push origin main
```
**Resultado esperado:** ❌ ERROR - "Branch 'main' is protected"

2. Crea una feature branch y PR:
```bash
git checkout -b feature/test-protection
git commit --allow-empty -m "test: Verificar protección"
git push origin feature/test-protection
```
Luego en GitHub:
- Crea el PR
- **No podrás hacer merge** hasta que:
  - 2 personas aprueben ✅
  - Los tests pasen ✅

---

## 📸 Capturas de Referencia

### Configuración recomendada:

```
Branch protection rule for main:
├── Require a pull request before merging
│   ├── Required approvals: 2
│   └── Dismiss stale approvals: ✓
├── Require status checks to pass
│   ├── Require branches to be up to date: ✓
│   └── Status checks: test
├── Require conversation resolution: ✓
└── Do not allow bypassing: ✓
```

---

## 🎯 Resultado Final

Con estas configuraciones:
- ❌ **Nadie** puede pushear directamente a `main` o `develop`
- ✅ **Todos** deben crear PRs desde `feature/*` o `hotfix/*`
- ✅ Los PRs requieren **2 aprobaciones**
- ✅ Los PRs requieren que **los tests pasen** en CI
- ✅ GitHub Actions ejecuta automáticamente los tests

---

## 🚀 Próximos Pasos

Después de configurar:
1. Informar al equipo sobre las nuevas reglas
2. Compartir la [Guía de Gitflow](./GITFLOW_GUIDE.md)
3. Hacer un PR de prueba para verificar el flujo
