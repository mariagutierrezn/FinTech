# Guía de Gitflow y Protección de Ramas

**HUMAN REVIEW (Maria Paula Gutierrez):**  
Esta guía explica cómo trabajar con Gitflow y las reglas de protección configuradas para mantener la calidad del código.

---

## 🌳 Estructura de Ramas

### Ramas Principales (Protegidas)

- **`main`** - Producción
  - Código estable y probado
  - Solo recibe merges desde `develop` o `hotfix/*`
  - Requiere 2 aprobaciones para merge
  
- **`develop`** - Desarrollo
  - Integración de features
  - Recibe merges desde `feature/*`
  - Requiere 2 aprobaciones para merge

### Ramas de Trabajo

- **`feature/*`** - Nuevas funcionalidades
  - Ejemplo: `feature/regla-ubicacion`
  - Se crean desde `develop`
  - Se mergean a `develop`
  
- **`hotfix/*`** - Correcciones urgentes
  - Ejemplo: `hotfix/fix-amount-validation`
  - Se crean desde `main`
  - Se mergean a `main` y `develop`

---

## 🚀 Flujo de Trabajo

### 1. Iniciar una Nueva Feature

```bash
# Asegúrate de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear rama feature
git checkout -b feature/nombre-descriptivo

# Ejemplo:
git checkout -b feature/velocity-check
```

### 2. Desarrollo con TDD

```bash
# 1. Escribir tests PRIMERO
code tests/unit/test_velocity_strategy.py

# 2. Commit de tests
git add tests/
git commit -m "test: Add velocity strategy tests (RED)"

# 3. Implementar código
code services/shared/domain/strategies/velocity.py

# 4. Commit de implementación
git add services/
git commit -m "feat: Implement velocity strategy (GREEN)"

# 5. Verificar que tests pasen
pytest tests/unit/test_velocity_strategy.py
```

### 3. Push y Crear Pull Request

```bash
# Push a GitHub
git push origin feature/velocity-check

# Crear PR en GitHub desde la interfaz web:
# 1. Ir a: https://github.com/tu-usuario/fraud-detection-engine
# 2. Click en "Compare & pull request"
# 3. Completar el template del PR
# 4. Asignar revisores (mínimo 2)
```

### 4. Code Review

El PR debe cumplir:
- ✅ **2 aprobaciones mínimo**
- ✅ **Tests pasan en CI** (GitHub Actions)
- ✅ **Checklist completado**
- ✅ **Sin conflictos con develop**

### 5. Merge

Una vez aprobado:
```bash
# Se hace merge desde GitHub (Squash and Merge)
# Luego actualizar local:
git checkout develop
git pull origin develop

# Eliminar rama feature local
git branch -d feature/velocity-check
```

---

## 🔒 Reglas de Protección Configuradas

### En `main`:
- ❌ Push directo bloqueado
- ✅ Requiere PR
- ✅ Requiere 2 aprobaciones
- ✅ Requiere que CI pase (tests)
- ✅ Requiere rama actualizada antes de merge
- ❌ No permite force push
- ✅ Solo admins pueden hacer merge directo

### En `develop`:
- ❌ Push directo bloqueado
- ✅ Requiere PR
- ✅ Requiere 2 aprobaciones
- ✅ Requiere que CI pase (tests)
- ✅ Requiere rama actualizada antes de merge

---

## 🔥 Hotfixes (Correcciones Urgentes)

```bash
# 1. Crear desde main
git checkout main
git pull origin main
git checkout -b hotfix/fix-critico

# 2. Hacer el fix
code services/shared/domain/fix.py
git add .
git commit -m "fix: Corregir validación crítica"

# 3. Push y PR a main
git push origin hotfix/fix-critico
# Crear PR a main con etiqueta "hotfix"

# 4. Después del merge a main, también merge a develop
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## 📝 Convenciones de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: Add velocity detection strategy"

# Fixes
git commit -m "fix: Correct amount validation logic"

# Tests (TDD)
git commit -m "test: Add location strategy tests (RED)"

# Refactor
git commit -m "refactor: Optimize fraud evaluation"

# Docs
git commit -m "docs: Update TDD guide"

# Config
git commit -m "config: Update pytest settings"
```

---

## ✅ Checklist Antes de Crear PR

- [ ] Rama creada desde `develop` (o `main` si es hotfix)
- [ ] Tests escritos ANTES del código (TDD)
- [ ] Todos los tests pasan localmente
- [ ] Commits siguen Conventional Commits
- [ ] Sin archivos de build/cache (node_modules, __pycache__, etc.)
- [ ] Sin credenciales hardcodeadas
- [ ] Comentarios HUMAN REVIEW agregados
- [ ] PR template completado

---

## 🚫 Errores Comunes a Evitar

### ❌ NO hacer:
```bash
# Push directo a main/develop (está bloqueado)
git push origin main  # ❌ FALLA

# Commits sin convención
git commit -m "changes"  # ❌ Poco descriptivo

# Código sin tests
git commit -m "feat: New feature" # ❌ Falta commit de tests ANTES
```

### ✅ SÍ hacer:
```bash
# Usar feature branches
git checkout -b feature/mi-feature

# Commits descriptivos
git commit -m "feat: Add geolocation validation strategy"

# TDD: Tests primero
git commit -m "test: Add geolocation tests (RED)"
git commit -m "feat: Implement geolocation validation (GREEN)"
```

---

## 🛠️ Comandos Útiles

```bash
# Ver ramas locales
git branch

# Ver ramas remotas
git branch -r

# Sincronizar con develop
git checkout develop
git pull origin develop

# Ver estado del repositorio
git status

# Ver historial de commits
git log --oneline --graph --all

# Eliminar rama local
git branch -d feature/nombre

# Eliminar rama remota
git push origin --delete feature/nombre
```

---

## 📚 Recursos

- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [GitHub Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🤝 Soporte

Si tienes dudas sobre el flujo de trabajo:
1. Revisa esta guía
2. Consulta con el equipo
3. Revisa PRs anteriores como ejemplo
