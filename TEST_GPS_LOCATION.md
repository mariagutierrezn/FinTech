# Prueba de Ubicación GPS

## 🎯 Objetivo
Verificar que el sistema de ubicación funciona correctamente con GPS y entrada manual de coordenadas.

## ✅ Cambios Implementados

### Frontend (LocationInput Component)
- ✅ Botón GPS para obtener ubicación automática
- ✅ Input manual para escribir coordenadas
- ✅ Validación de formato "lat,lon"
- ✅ Ejemplos de ciudades con coordenadas

### Backend (API Gateway)
- ✅ Acepta coordenadas directamente en formato "lat,lon"
- ✅ Fallback a mapeo de ciudades si el formato es texto
- ✅ Validación y parseo robusto

## 🧪 Pasos de Prueba

### Opción 1: Usar GPS del Navegador

1. Abre http://localhost:3000
2. Haz clic en "Nueva Transacción"
3. Haz clic en el botón "📍 Usar Ubicación GPS"
4. Acepta el permiso del navegador cuando lo solicite
5. Verifica que el campo se llene automáticamente con coordenadas (ej: "4.6097,-74.0817")
6. Completa el resto del formulario:
   - Monto: $1000
   - Comercio: Test Store
   - Método de pago: credit_card
7. Envía la transacción
8. Ve a "Mis Transacciones" para ver el resultado

### Opción 2: Entrada Manual de Coordenadas

1. Abre http://localhost:3000
2. Haz clic en "Nueva Transacción"
3. En el campo Ubicación, escribe coordenadas manualmente:
   - Bogotá: `4.6097,-74.0817`
   - Medellín: `6.2442,-75.5812`
   - Cali: `3.4516,-76.5320`
   - New York: `40.7128,-74.0060`
4. Completa el resto del formulario
5. Envía la transacción
6. Ve a "Mis Transacciones" para ver el resultado

### Opción 3: Usar Nombre de Ciudad (Fallback)

1. Abre http://localhost:3000
2. Haz clic en "Nueva Transacción"
3. En el campo Ubicación, escribe:
   - "New York, USA"
   - "Bogota, Colombia"
   - "Miami, USA"
4. El backend convertirá automáticamente a coordenadas

## 🔍 Verificación en Admin

1. Abre http://localhost:3001
2. Ve a "Transacciones"
3. Busca tu transacción recién creada
4. Verifica que:
   - La ubicación se muestre con coordenadas correctas
   - Los datos coincidan con lo que enviaste

## 📝 Formato de Ubicación

### Frontend → Backend
```
"4.6097,-74.0817"  // Coordenadas GPS o manual
"New York, USA"    // Nombre de ciudad (fallback)
```

### Backend → MongoDB
```json
{
  "location": {
    "latitude": 4.6097,
    "longitude": -74.0817
  }
}
```

## 🐛 Troubleshooting

### El GPS no funciona
- ✅ Verifica que estás en HTTPS o localhost
- ✅ Acepta el permiso del navegador
- ✅ Verifica en la consola del navegador si hay errores
- ✅ Intenta con entrada manual mientras tanto

### Las coordenadas no se validan
- ✅ Verifica el formato: "lat,lon" (coma sin espacios)
- ✅ Latitud: -90 a 90
- ✅ Longitud: -180 a 180
- ✅ Ejemplo válido: "4.6097,-74.0817"

### Error al enviar transacción
- ✅ Verifica que todos los campos estén llenos
- ✅ Revisa la consola del navegador (F12)
- ✅ Verifica que el backend esté corriendo: `docker-compose ps`

## ✨ Ventajas del Nuevo Sistema

1. **Precisión**: GPS obtiene coordenadas exactas del usuario
2. **Flexibilidad**: Opción manual para casos específicos
3. **Compatibilidad**: Sigue funcionando con nombres de ciudades
4. **Validación**: Formato correcto garantizado
5. **UX Mejorado**: Ejemplos y ayuda visual en el formulario

## 🎉 Resultado Esperado

- Usuario puede usar su ubicación GPS real
- Usuario puede ingresar coordenadas manualmente
- Admin ve coordenadas precisas en el dashboard
- Sistema valida y procesa correctamente todos los formatos
