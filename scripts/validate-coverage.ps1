# Script para validar que el coverage se genera correctamente para SonarQube
# Ejecuta tests, genera coverage.xml y verifica formato

Write-Host "🔍 Validando generación de coverage para SonarQube..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Poetry está instalado
if (-not (Get-Command poetry -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Poetry no está instalado. Instálalo primero:" -ForegroundColor Red
    Write-Host "   curl -sSL https://install.python-poetry.org | python3 -" -ForegroundColor Yellow
    exit 1
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "pyproject.toml")) {
    Write-Host "❌ No se encontró pyproject.toml. Ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Limpiar coverage.xml anterior si existe
if (Test-Path "coverage.xml") {
    Write-Host "🗑️  Eliminando coverage.xml anterior..." -ForegroundColor Yellow
    Remove-Item "coverage.xml" -Force
}

# Limpiar .coverage si existe
if (Test-Path ".coverage") {
    Write-Host "🗑️  Eliminando .coverage anterior..." -ForegroundColor Yellow
    Remove-Item ".coverage" -Force
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
poetry install --no-interaction --no-ansi
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Ejecutando tests con coverage..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar tests con coverage
$env:PYTHONPATH = $PWD
poetry run pytest tests/unit/ `
    --cov=services `
    --cov-report=xml:coverage.xml `
    --cov-report=term `
    --cov-report=term-missing `
    -v `
    --tb=short

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  Algunos tests fallaron, pero continuando con la validación del coverage..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 VALIDACIÓN DEL COVERAGE.XML" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que coverage.xml existe
if (Test-Path "coverage.xml") {
    Write-Host "✅ coverage.xml generado correctamente" -ForegroundColor Green
    
    # Obtener tamaño del archivo
    $fileSize = (Get-Item "coverage.xml").Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    Write-Host "   Tamaño: $fileSizeKB KB" -ForegroundColor Gray
    
    # Leer y validar estructura del XML
    Write-Host ""
    Write-Host "📄 Estructura del coverage.xml:" -ForegroundColor Cyan
    $xmlContent = Get-Content "coverage.xml" -Raw
    
    # Verificar que es un XML válido
    try {
        [xml]$xml = $xmlContent
        Write-Host "   ✅ XML válido" -ForegroundColor Green
        
        # Verificar que tiene el elemento raíz correcto
        if ($xml.coverage) {
            Write-Host "   ✅ Elemento raíz 'coverage' encontrado" -ForegroundColor Green
            
            # Obtener información del coverage
            $lineRate = $xml.coverage.'line-rate'
            $branchRate = $xml.coverage.'branch-rate'
            $linesValid = $xml.coverage.'lines-valid'
            $linesCovered = $xml.coverage.'lines-covered'
            
            Write-Host ""
            Write-Host "📊 Métricas de cobertura:" -ForegroundColor Cyan
            Write-Host "   Líneas válidas: $linesValid" -ForegroundColor Gray
            Write-Host "   Líneas cubiertas: $linesCovered" -ForegroundColor Gray
            Write-Host "   Tasa de líneas: $([math]::Round($lineRate * 100, 2))%" -ForegroundColor $(if ($lineRate -ge 0.70) { "Green" } else { "Yellow" })
            Write-Host "   Tasa de branches: $([math]::Round($branchRate * 100, 2))%" -ForegroundColor Gray
            
            # Contar archivos en el coverage
            $fileCount = ($xml.coverage.packages.package.class | Measure-Object).Count
            Write-Host "   Archivos analizados: $fileCount" -ForegroundColor Gray
            
        } else {
            Write-Host "   ❌ No se encontró el elemento raíz 'coverage'" -ForegroundColor Red
        }
        
        # Verificar paths en el XML
        Write-Host ""
        Write-Host "🔍 Verificando paths en el coverage.xml:" -ForegroundColor Cyan
        $paths = $xml.coverage.packages.package.class | Select-Object -ExpandProperty filename -Unique | Select-Object -First 5
        if ($paths) {
            Write-Host "   Primeros 5 paths encontrados:" -ForegroundColor Gray
            foreach ($path in $paths) {
                Write-Host "   - $path" -ForegroundColor Gray
                
                # Verificar que los paths son relativos (no absolutos)
                if ($path.StartsWith("/") -or $path -match "^[A-Z]:\\") {
                    Write-Host "     ⚠️  ADVERTENCIA: Path absoluto detectado. SonarQube prefiere paths relativos." -ForegroundColor Yellow
                }
            }
        }
        
    } catch {
        Write-Host "   ❌ Error al parsear XML: $_" -ForegroundColor Red
    }
    
    # Mostrar primeras líneas del XML
    Write-Host ""
    Write-Host "📋 Primeras 10 líneas del coverage.xml:" -ForegroundColor Cyan
    Get-Content "coverage.xml" -Head 10 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ coverage.xml NO se generó" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Buscando archivos de coverage..." -ForegroundColor Yellow
    Get-ChildItem -Recurse -Filter "coverage.xml" | ForEach-Object {
        Write-Host "   Encontrado: $($_.FullName)" -ForegroundColor Gray
    }
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ VALIDACIÓN COMPLETA" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Verifica que coverage.xml está en el directorio raíz" -ForegroundColor Gray
Write-Host "   2. Verifica que los paths son relativos (no absolutos)" -ForegroundColor Gray
Write-Host "   3. Haz push de los cambios y revisa GitHub Actions" -ForegroundColor Gray
Write-Host "   4. Revisa SonarQube para ver el coverage importado" -ForegroundColor Gray
Write-Host ""

