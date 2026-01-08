# Guía de Prueba Manual - Autenticación de Usuario

## ⚠️ IMPORTANTE: Problema Detectado

El flujo de autenticación está implementado **pero hay un issue**: el **userId es hardcodeado** en el código.

Actualmente la aplicación de usuario usa: `userId = "user_demo"`

## Solución Rápida

Para probar el flujo, debes crear transacciones con el **userId correcto**.

## 📝 Pasos para Probar el Flujo Completo

### 1. Abrir Frontend de Usuario
- Navega a: http://localhost:3000
- Deberías ver dos pestañas:
  - "Nueva Transacción"
  - "Mis Transacciones"

### 2. Crear Transacción Sospechosa

**Opción A: Desde el Frontend (Recomendado)**
1. En http://localhost:3000 ir a "Nueva Transacción"
2. **MODIFICAR TEMPORALMENTE** el código para usar userId correcto:
   - El formulario debe enviar `userId: "user_demo"` (no otro userId)
3. Llenar:
   - **Amount**: 11000 (para generar 1 violación = SUSPICIOUS)
   - **Location**: Cualquier ciudad
   - **Device ID**: device_001
4. Click "Validar Transacción"
5. Debería aparecer: **SUSPICIOUS** ⚠️

**Opción B: Con PowerShell (Más fácil para pruebas)**
```powershell
# Crear transacción sospechosa con userId correcto
$transaction = @{
    userId = "user_demo"
    amount = 11000
    location = "4.6097,-74.0817"
    deviceId = "device_test_001"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/transaction/validate" `
    -Method Post `
    -Body $transaction `
    -ContentType "application/json"

Write-Host "Estado: $($response.status)" -ForegroundColor Yellow
Write-Host "Transaction ID: $($response.transactionId)"
```

### 3. Ver en "Mis Transacciones"
1. En http://localhost:3000 hacer click en **"Mis Transacciones"**
2. Deberías ver tu transacción con:
   - Estado: **⏳ Revisión** (amarillo)
   - Un banner grande amarillo que dice:
     ```
     ⚠️ ¿Realizaste esta transacción?
     
     [✓ Fui yo]  [✗ No fui yo]
     ```

### 4. Autenticar como Usuario
1. Click en **"✓ Fui yo"** (botón verde)
2. Debería aparecer un alert: "Gracias por confirmar. Un analista revisará tu transacción pronto."
3. El banner amarillo desaparecerá
4. La transacción ahora mostrará un badge: **"Confirmaste"** (azul)

### 5. Revisar como Admin
1. Abrir http://localhost:3001 (Admin Dashboard)
2. Ir a "Transacciones" en el menú lateral
3. Filtrar por **"SUSPICIOUS"**
4. Buscar tu transacción en la tabla
5. En la columna **"Autenticación"** deberías ver:
   - Badge verde: **"✓ Usuario confirmó"**
6. Ahora puedes hacer click en **"✓ Aprobar"** con confianza
7. Debería aparecer: "Transacción aprobada exitosamente"

### 6. Verificar Resultado Final
1. Volver a http://localhost:3000
2. Ir a "Mis Transacciones"
3. Tu transacción ahora debe mostrar:
   - Estado: **✓ Aprobada** (verde)
   - "Revisada por analyst_demo"

## 🐛 Problema Actual: userId Hardcodeado

**Ubicación del problema:**
- `frontend/user-app/src/pages/TransactionsPage.tsx` línea ~23
- `const userId = 'user_demo';`

**Impacto:**
- Solo funciona si las transacciones se crean con `userId: "user_demo"`
- En producción necesitarías:
  - Sistema de login/sesión
  - JWT token con userId
  - Contexto de autenticación en React

## 🔧 Solución Temporal para Pruebas

Si quieres probar con diferentes usuarios, puedes:

1. **Cambiar el userId en TransactionsPage.tsx**:
```typescript
// Línea ~23
const userId = 'user_test_123'; // Cambiar aquí
```

2. **Crear transacciones con ese mismo userId**:
```powershell
$transaction = @{
    userId = "user_test_123"  # Mismo userId
    amount = 11000
    location = "4.6097,-74.0817"
    deviceId = "device_001"
} | ConvertTo-Json
```

3. **Reconstruir frontend**:
```powershell
docker-compose build frontend-user
docker-compose up -d frontend-user
```

## ✅ Script de Prueba Automatizado

Ya existe un script que prueba todo el flujo:
```powershell
./test-auth-flow.ps1
```

Este script:
- ✅ Crea transacción con userId correcto
- ✅ Consulta transacciones del usuario
- ✅ Autentica como usuario
- ✅ Consulta como admin y ve autenticación
- ✅ Aprueba como admin
- ✅ Verifica resultado final

**Resultado esperado**: Todos los pasos en verde ✓

## 🎯 Para Implementar en Producción

Necesitarías agregar:

1. **Backend**: Sistema de autenticación (JWT, OAuth, etc.)
2. **Frontend**: 
   - Login page
   - Contexto de usuario autenticado
   - Protección de rutas
   - Header con token en requests
3. **Middleware**: Validación de tokens en cada request
4. **Base de datos**: Tabla de usuarios con credenciales

---

**Fecha**: 07/01/2026  
**Estado Actual**: ✅ Funciona con userId hardcodeado  
**Próximo Paso**: Agregar sistema de autenticación real
