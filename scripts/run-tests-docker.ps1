# Script para ejecutar tests usando Docker
# Útil cuando Python no está instalado localmente

param(
    [Parameter(Mandatory=$false)]
    [switch]$Coverage,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"

Write-Host "=== Ejecutando Tests en Docker ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté corriendo
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar que los servicios estén corriendo
Write-Host "Verificando servicios..." -ForegroundColor Yellow
$containers = docker-compose ps --services --filter "status=running"

if ($containers -notcontains "mongodb" -or $containers -notcontains "redis" -or $containers -notcontains "rabbitmq") {
    Write-Host "Levantando servicios de infraestructura..." -ForegroundColor Yellow
    docker-compose up -d mongodb redis rabbitmq
    
    Write-Host "Esperando a que los servicios estén listos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

# Construir comando de pytest
$pytestCommand = "pytest tests/unit/ -v"

if ($Coverage) {
    $pytestCommand += " --cov=services --cov-report=term --cov-report=html --cov-report=xml"
}

if ($VerboseOutput) {
    $pytestCommand += " -vv"
}

# Crear contenedor temporal para ejecutar tests
Write-Host "Ejecutando tests en contenedor..." -ForegroundColor Green
Write-Host "Comando: $pytestCommand" -ForegroundColor Gray
Write-Host ""

# Ejecutar tests en un contenedor temporal
# ⚠️ Las credenciales deben configurarse mediante archivo .env
# Leer desde variables de entorno o usar valores del .env
$mongodbUrl = if ($env:MONGODB_URL) { $env:MONGODB_URL } else { "mongodb://admin:CHANGE_PASSWORD@fraud-mongodb:27017" }
$redisUrl = if ($env:REDIS_URL) { $env:REDIS_URL } else { "redis://fraud-redis:6379" }
$rabbitmqUrl = if ($env:RABBITMQ_URL) { $env:RABBITMQ_URL } else { "amqp://fraud:CHANGE_PASSWORD@fraud-rabbitmq:5672" }

docker run --rm `
    --network fraud-detection-engine_fraud-network `
    -v "${PWD}:/app" `
    -w /app `
    -e PYTHONPATH=/app `
    -e MONGODB_URL=$mongodbUrl `
    -e REDIS_URL=$redisUrl `
    -e RABBITMQ_URL=$rabbitmqUrl `
    python:3.11-slim `
    sh -c "pip install --quiet -r requirements-test.txt && $pytestCommand"

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "Tests completados exitosamente" -ForegroundColor Green
    
    if ($Coverage) {
        Write-Host ""
        Write-Host "Reporte de cobertura generado en:" -ForegroundColor Yellow
        Write-Host "  - htmlcov/index.html" -ForegroundColor Gray
        Write-Host "  - coverage.xml" -ForegroundColor Gray
    }
} else {
    Write-Host "Tests fallaron" -ForegroundColor Red
}

exit $exitCode
