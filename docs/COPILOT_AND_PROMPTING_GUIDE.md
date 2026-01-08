# Guía de Uso de GitHub Copilot y Prompting para Tests

**HUMAN REVIEW (Maria Paula Gutierrez):**  
Esta guía documenta cómo usar GitHub Copilot y técnicas de prompting efectivas para acelerar el desarrollo, especialmente en generación de tests y edge cases.

---

## 🤖 GitHub Copilot para Boilerplate y Tests

### ¿Qué es GitHub Copilot?

GitHub Copilot es un asistente de IA que:
- ✅ Genera código basándose en comentarios y contexto
- ✅ Sugiere tests automáticamente
- ✅ Completa boilerplate repetitivo
- ✅ Detecta edge cases que podrías olvidar

---

## 📝 Técnicas de Prompting para Tests

### 1. Comentarios Descriptivos

GitHub Copilot genera mejor código cuando escribes comentarios claros:

```python
# Test: Debe rechazar transacciones con monto negativo
# Edge case: -0.01, -999999.99
def test_transaction_rejects_negative_amount():
    # Copilot generará el código automáticamente
```

**Resultado:**
```python
def test_transaction_rejects_negative_amount():
    """Test: Debe rechazar transacciones con monto negativo."""
    # Arrange
    location = Location(latitude=4.7110, longitude=-74.0721)
    
    # Act & Assert
    with pytest.raises(ValueError):
        Transaction(
            transaction_id="test_001",
            user_id="user_001",
            amount=Decimal("-0.01"),  # Edge case
            location=location,
            device_id="device_001",
            timestamp=datetime.now()
        )
```

### 2. Prompt Pattern: "Test all edge cases"

```python
# Test all edge cases for latitude validation:
# - Exactly -90 (minimum valid)
# - Exactly 90 (maximum valid)
# - Just below -90 (invalid)
# - Just above 90 (invalid)
# - Zero
# - Floating point precision edge cases
def test_location_latitude_edge_cases():
    # Copilot generará todos los casos automáticamente
```

**Resultado generado por Copilot:**
```python
def test_location_latitude_edge_cases():
    """Test all edge cases for latitude validation."""
    # Valid boundaries
    assert Location(latitude=-90.0, longitude=0.0).latitude == -90.0
    assert Location(latitude=90.0, longitude=0.0).latitude == 90.0
    assert Location(latitude=0.0, longitude=0.0).latitude == 0.0
    
    # Invalid boundaries
    with pytest.raises(ValueError):
        Location(latitude=-90.00001, longitude=0.0)
    
    with pytest.raises(ValueError):
        Location(latitude=90.00001, longitude=0.0)
    
    # Floating point precision
    assert Location(latitude=89.999999, longitude=0.0).latitude == 89.999999
```

### 3. Prompt Pattern: "Test error handling"

```python
# Test error handling for all invalid inputs:
# - None values
# - Empty strings
# - Invalid types
# - Out of range values
# - Unicode edge cases
def test_transaction_id_error_handling():
    # Copilot genera validaciones completas
```

### 4. Prompt Pattern: "Test boundary conditions"

```python
# Test boundary conditions for amount threshold:
# - Exactly at threshold (1500.00)
# - One cent below (1499.99)
# - One cent above (1500.01)
# - Maximum Decimal precision
# - Zero
def test_amount_threshold_boundaries():
    # Copilot genera casos precisos
```

---

## 🎯 Casos de Prueba de Borde (Edge Cases)

### Edge Cases Comunes por Tipo de Dato

#### Números (Decimal, float, int)
```python
# Generated with Copilot: Test edge cases for numeric amount
def test_amount_edge_cases():
    """Test edge cases for transaction amounts."""
    # Minimum valid
    assert validate_amount(Decimal("0.01")) == True
    
    # Maximum realistic
    assert validate_amount(Decimal("999999999.99")) == True
    
    # Precision edge cases
    assert validate_amount(Decimal("0.001")) == True  # 3 decimals
    assert validate_amount(Decimal("100.999")) == True  # Rounding
    
    # Boundary
    with pytest.raises(ValueError):
        validate_amount(Decimal("0.00"))  # Zero
    
    with pytest.raises(ValueError):
        validate_amount(Decimal("-0.01"))  # Negative
```

#### Strings
```python
# Generated with Copilot: Test edge cases for user ID strings
def test_user_id_edge_cases():
    """Test edge cases for user ID validation."""
    # Empty and whitespace
    with pytest.raises(ValueError):
        validate_user_id("")
    
    with pytest.raises(ValueError):
        validate_user_id("   ")
    
    # Special characters
    assert validate_user_id("user@123") == True
    assert validate_user_id("user-001") == True
    
    # Unicode
    assert validate_user_id("用户123") == True  # Chinese
    assert validate_user_id("usuário") == True  # Portuguese
    
    # Length boundaries
    assert validate_user_id("a") == True  # Min
    assert validate_user_id("a" * 255) == True  # Max
    with pytest.raises(ValueError):
        validate_user_id("a" * 256)  # Over max
```

#### Coordenadas Geográficas
```python
# Generated with Copilot: Test edge cases for geographic coordinates
def test_location_coordinates_edge_cases():
    """Test edge cases for latitude and longitude."""
    # Poles
    assert Location(latitude=90.0, longitude=0.0)  # North Pole
    assert Location(latitude=-90.0, longitude=0.0)  # South Pole
    
    # Prime meridian and antimeridian
    assert Location(latitude=0.0, longitude=0.0)  # Null Island
    assert Location(latitude=0.0, longitude=180.0)  # Antimeridian east
    assert Location(latitude=0.0, longitude=-180.0)  # Antimeridian west
    
    # High precision (GPS accuracy)
    loc = Location(latitude=4.711005, longitude=-74.072092)
    assert loc.latitude == pytest.approx(4.711005, abs=1e-6)
    
    # Boundary violations
    with pytest.raises(ValueError):
        Location(latitude=90.000001, longitude=0.0)  # Just over
    
    with pytest.raises(ValueError):
        Location(latitude=0.0, longitude=180.000001)  # Just over
```

#### Fechas y Timestamps
```python
# Generated with Copilot: Test edge cases for timestamps
def test_transaction_timestamp_edge_cases():
    """Test edge cases for transaction timestamps."""
    # Unix epoch
    epoch = datetime(1970, 1, 1, 0, 0, 0)
    assert validate_timestamp(epoch) == True
    
    # Y2K
    y2k = datetime(2000, 1, 1, 0, 0, 0)
    assert validate_timestamp(y2k) == True
    
    # Leap seconds
    leap = datetime(2016, 12, 31, 23, 59, 60)  # Leap second
    assert validate_timestamp(leap) == True
    
    # Future dates
    future = datetime(2099, 12, 31, 23, 59, 59)
    with pytest.raises(ValueError):
        validate_timestamp(future)  # Too far in future
    
    # Timezone edge cases
    utc_now = datetime.now(timezone.utc)
    assert validate_timestamp(utc_now) == True
```

---

## 🚀 Flujo de Trabajo con Copilot

### Paso 1: Escribir el comentario descriptivo
```python
# Test: Debe detectar fraude cuando hay 5+ transacciones en 10 minutos
# Edge cases:
# - Exactamente 5 transacciones en 10 minutos (boundary)
# - 4 transacciones en 9:59 minutos (just below)
# - 6 transacciones en 10:01 minutos (just over)
```

### Paso 2: Presionar Tab para aceptar sugerencia

Copilot generará:
```python
def test_velocity_detection_edge_cases():
    """Test edge cases for velocity-based fraud detection."""
    strategy = VelocityStrategy(max_transactions=5, window_minutes=10)
    
    # Exactly at boundary (should not trigger)
    transactions_at_boundary = [
        create_transaction(timestamp="10:00"),
        create_transaction(timestamp="10:02"),
        create_transaction(timestamp="10:04"),
        create_transaction(timestamp="10:06"),
        create_transaction(timestamp="10:08"),  # 5th at 10:08
    ]
    result = strategy.evaluate(transactions_at_boundary[-1], transactions_at_boundary[:-1])
    assert result["risk_level"] == RiskLevel.LOW_RISK
    
    # Just over boundary (should trigger)
    transactions_over = transactions_at_boundary + [
        create_transaction(timestamp="10:09")  # 6th in window
    ]
    result = strategy.evaluate(transactions_over[-1], transactions_over[:-1])
    assert result["risk_level"] == RiskLevel.HIGH_RISK
```

### Paso 3: Revisar y ajustar

- ✅ Verificar que los edge cases sean correctos
- ✅ Agregar comentarios HUMAN REVIEW si modificaste algo
- ✅ Ejecutar tests para validar

---

## 💡 Tips para Mejores Resultados

### 1. Usa nombres descriptivos
```python
# ❌ Malo
def test_thing():
    pass

# ✅ Bueno
def test_amount_threshold_rejects_exactly_1500_dollars():
    pass
```

### 2. Estructura tus comentarios
```python
# Test: [Qué debe hacer]
# Given: [Condiciones iniciales]
# When: [Acción]
# Then: [Resultado esperado]
# Edge cases: [Lista de casos límite]
```

### 3. Solicita explícitamente edge cases
```python
# Generate comprehensive edge case tests for:
# - Null/None values
# - Empty collections
# - Boundary values
# - Invalid types
# - Unicode/special characters
# - Concurrent modifications
```

### 4. Usa ejemplos inline
```python
# Test: Debe validar formato de device_id
# Valid examples: "device_001", "mobile_ABC123", "tablet-xyz"
# Invalid examples: "", "   ", "dev", "device with spaces"
```

---

## 📊 Checklist de Edge Cases

Usa esta lista para asegurar cobertura completa:

### Números
- [ ] Cero
- [ ] Negativos
- [ ] Máximo/Mínimo del tipo
- [ ] Límites de precisión decimal
- [ ] Infinity / NaN (si aplica)

### Strings
- [ ] Vacío ""
- [ ] Solo espacios "   "
- [ ] Muy largo (1000+ caracteres)
- [ ] Unicode/emojis
- [ ] Caracteres especiales
- [ ] SQL injection attempts

### Colecciones
- [ ] Vacía []
- [ ] Un solo elemento [x]
- [ ] Duplicados [x, x, x]
- [ ] Orden aleatorio

### Fechas
- [ ] Pasado lejano
- [ ] Futuro lejano
- [ ] Ahora mismo
- [ ] Zona horaria UTC vs local
- [ ] Horario de verano

### Ubicación
- [ ] Polos (90°, -90°)
- [ ] Antimeridiano (180°, -180°)
- [ ] Ecuador/Meridiano (0°, 0°)
- [ ] Alta precisión (6+ decimales)

---

## 🎓 Ejemplos Reales del Proyecto

### Ejemplo 1: Tests generados para Location

```python
# GENERATED WITH GITHUB COPILOT
# Prompt: "Generate comprehensive edge case tests for Location value object
# including boundary coordinates, precision limits, and invalid inputs"

class TestLocationEdgeCases:
    """Edge cases for Location value object."""
    
    def test_north_pole_coordinates(self):
        """North Pole should be valid."""
        loc = Location(latitude=90.0, longitude=0.0)
        assert loc.latitude == 90.0
    
    def test_south_pole_coordinates(self):
        """South Pole should be valid."""
        loc = Location(latitude=-90.0, longitude=0.0)
        assert loc.latitude == -90.0
    
    def test_antimeridian_east(self):
        """Antimeridian east (180°) should be valid."""
        loc = Location(latitude=0.0, longitude=180.0)
        assert loc.longitude == 180.0
    
    def test_antimeridian_west(self):
        """Antimeridian west (-180°) should be valid."""
        loc = Location(latitude=0.0, longitude=-180.0)
        assert loc.longitude == -180.0
    
    def test_high_precision_gps_coordinates(self):
        """Should handle 6+ decimal precision (GPS accuracy ~10cm)."""
        loc = Location(latitude=4.7110050, longitude=-74.0720920)
        assert loc.latitude == pytest.approx(4.7110050, abs=1e-7)
    
    def test_just_over_max_latitude(self):
        """Should reject latitude just over 90°."""
        with pytest.raises(ValueError, match="latitude"):
            Location(latitude=90.000001, longitude=0.0)
    
    def test_just_under_min_latitude(self):
        """Should reject latitude just under -90°."""
        with pytest.raises(ValueError, match="latitude"):
            Location(latitude=-90.000001, longitude=0.0)
```

---

## 📚 Recursos

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Property-Based Testing](https://hypothesis.readthedocs.io/)

---

## ✅ Verificación

Para confirmar que estás usando Copilot efectivamente:

1. ✅ Comentarios descriptivos antes de cada test
2. ✅ Edge cases explícitamente listados en comentarios
3. ✅ Tests generados cubren casos límite
4. ✅ Comentarios "GENERATED WITH COPILOT" donde aplica
5. ✅ Coverage >= 70% con edge cases incluidos
