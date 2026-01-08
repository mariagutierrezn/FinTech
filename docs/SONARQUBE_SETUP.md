# Configuración de SonarQube para CI/CD

**HUMAN REVIEW (Maria Paula Gutierrez):**  
Esta guía explica cómo configurar SonarQube para análisis automático de calidad en el pipeline CI.

---

## 🎯 Requisitos

- ✅ Cuenta de SonarQube Server o SonarCloud
- ✅ Proyecto creado en SonarQube
- ✅ Token de acceso generado

---

## 📋 Paso 1: Crear Proyecto en SonarQube

### Opción A: SonarQube Server (On-Premise)

1. Accede a tu instancia de SonarQube Server:
   ```
   http://tu-servidor-sonarqube:9000
   ```

2. Login con tus credenciales

3. Click en **"Create Project"**

4. Configurar proyecto:
   - **Project key:** `fraud-detection-engine`
   - **Display name:** `Fraud Detection Engine`
   - **Main branch:** `main`

5. Click en **"Set Up"**

### Opción B: SonarCloud (Cloud)

1. Accede a [https://sonarcloud.io](https://sonarcloud.io)

2. Login con GitHub

3. Click en **"+"** → **"Analyze new project"**

4. Seleccionar repositorio: `fraud-detection-engine`

5. Click en **"Set Up"**

---

## 🔑 Paso 2: Generar Token de Acceso

### En SonarQube Server:

1. Click en tu avatar (esquina superior derecha)
2. **My Account** → **Security**
3. En "Generate Tokens":
   - **Name:** `GitHub-Actions-CI`
   - **Type:** `Project Analysis Token`
   - **Expires in:** `90 days` (o sin expiración)
4. Click en **"Generate"**
5. **⚠️ COPIAR EL TOKEN** (solo se muestra una vez)

### En SonarCloud:

1. Click en tu avatar → **My Account**
2. **Security** tab
3. **Generate Token**:
   - **Name:** `fraud-detection-ci`
   - **Type:** `User Token`
4. Click **"Generate"**
5. **⚠️ COPIAR EL TOKEN**

---

## 🔒 Paso 3: Configurar Secrets en GitHub

1. En GitHub, ve a tu repositorio:
   ```
   https://github.com/TU-USUARIO/fraud-detection-engine
   ```

2. Click en **Settings** (Configuración)

3. En el menú lateral: **Secrets and variables** → **Actions**

4. Click en **"New repository secret"**

### Secret 1: SONAR_TOKEN

- **Name:** `SONAR_TOKEN`
- **Secret:** Pega el token copiado anteriormente
- Click en **"Add secret"**

### Secret 2: SONAR_HOST_URL

#### Para SonarQube Server:
- **Name:** `SONAR_HOST_URL`
- **Secret:** `http://tu-servidor-sonarqube:9000`
- Click en **"Add secret"**

#### Para SonarCloud:
- **Name:** `SONAR_HOST_URL`
- **Secret:** `https://sonarcloud.io`
- Click en **"Add secret"**

---

## ✅ Paso 4: Verificar Configuración

### Verificar `sonar-project.properties`

El archivo ya está configurado en el repositorio:

```properties
# Información del proyecto
sonar.projectKey=fraud-detection-engine
sonar.projectName=Fraud Detection Engine
sonar.projectVersion=0.1.0

# Directorios
sonar.sources=services
sonar.tests=tests

# Cobertura
sonar.python.coverage.reportPaths=coverage.xml
```

Si usas SonarCloud, agrega también:
```properties
sonar.organization=tu-organizacion-en-sonarcloud
```

---

## 🚀 Paso 5: Ejecutar el Pipeline

1. Haz un commit y push:
   ```bash
   git add .
   git commit -m "config: Configure SonarQube integration"
   git push origin develop
   ```

2. Ve a **Actions** en GitHub:
   ```
   https://github.com/TU-USUARIO/fraud-detection-engine/actions
   ```

3. Verás 3 jobs ejecutándose:
   - ✅ **Build Docker Images**
   - ✅ **Ejecutar Tests Unitarios**
   - ✅ **Análisis SonarQube**

4. Una vez completado, verás los resultados en SonarQube

---

## 📊 Paso 6: Ver Resultados en SonarQube

1. Accede a tu SonarQube:
   - Server: `http://tu-servidor:9000/dashboard?id=fraud-detection-engine`
   - Cloud: `https://sonarcloud.io/dashboard?id=fraud-detection-engine`

2. Verás métricas de calidad:
   - 🐛 **Bugs:** 0 (objetivo)
   - 🔒 **Vulnerabilities:** 0 (objetivo)
   - 🎯 **Code Smells:** < 10
   - 📊 **Coverage:** >= 70%
   - 📈 **Duplications:** < 3%

---

## 🎨 Paso 7: Agregar Badge al README

### Para SonarQube Server:

```markdown
[![Quality Gate Status](http://tu-servidor:9000/api/project_badges/measure?project=fraud-detection-engine&metric=alert_status)](http://tu-servidor:9000/dashboard?id=fraud-detection-engine)
```

### Para SonarCloud:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fraud-detection-engine&metric=alert_status)](https://sonarcloud.io/dashboard?id=fraud-detection-engine)

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fraud-detection-engine&metric=coverage)](https://sonarcloud.io/dashboard?id=fraud-detection-engine)
```

---

## 🔧 Configuración Avanzada (Opcional)

### Quality Gates Personalizados

En SonarQube:
1. **Quality Gates** → **Create**
2. Configurar condiciones:
   ```
   Coverage on New Code >= 80%
   Maintainability Rating on New Code = A
   Reliability Rating on New Code = A
   Security Rating on New Code = A
   Duplicated Lines on New Code <= 3%
   ```
3. Asignar al proyecto

### Exclusiones Adicionales

En `sonar-project.properties`:
```properties
# Excluir archivos generados
sonar.exclusions=**/migrations/**,**/__pycache__/**,**/node_modules/**

# Excluir tests del análisis de duplicación
sonar.cpd.exclusions=**/test_*.py
```

---

## 🐛 Troubleshooting

### Error: "SONAR_TOKEN not found"

**Solución:** Verificar que el secret `SONAR_TOKEN` esté configurado correctamente en GitHub Settings.

### Error: "Could not find a default branch"

**Solución:** En SonarQube, configurar la rama principal:
1. Project Settings → Branches
2. Set `main` como main branch

### Error: "Quality Gate failed"

**Solución:** Revisar el dashboard de SonarQube para ver qué métricas fallaron y corregir el código.

### Error: "Coverage report not found"

**Solución:** Verificar que `coverage.xml` se genere en el paso de tests:
```bash
poetry run pytest tests/ --cov=services --cov-report=xml
```

---

## 📚 Recursos

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [GitHub Actions + SonarQube](https://docs.sonarqube.org/latest/analysis/github-integration/)

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en SonarQube
- [ ] Token generado
- [ ] `SONAR_TOKEN` configurado en GitHub Secrets
- [ ] `SONAR_HOST_URL` configurado en GitHub Secrets
- [ ] `sonar-project.properties` verificado
- [ ] Pipeline ejecutado exitosamente
- [ ] Resultados visibles en SonarQube dashboard
- [ ] Badge agregado al README (opcional)

---

## 🎯 Resultado Esperado

Con esta configuración, cada push a `main` o `develop` ejecutará:
1. ✅ Build de imágenes Docker
2. ✅ Tests unitarios y de integración
3. ✅ Análisis de calidad con SonarQube
4. ✅ Quality Gate check

Si todo pasa, el PR puede mergearse. Si el Quality Gate falla, el PR queda bloqueado hasta corregir los problemas de calidad.
