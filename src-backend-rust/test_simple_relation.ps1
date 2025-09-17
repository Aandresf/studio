# Script para probar la relación Producto-Variantes
$ErrorActionPreference = "SilentlyContinue"

$baseUrl = "http://127.0.0.1:8080"
$credentials = @{ username = "admin"; password = "admin" } | ConvertTo-Json

Write-Host "PRUEBA DE RELACIÓN PRODUCTO-VARIANTES" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor White

# Función segura para requests
function Invoke-SafeRequest {
    param($Uri, $Method = "GET", $Body = $null, $Headers = @{})
    try {
        if ($Body) {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType "application/json" -Headers $Headers -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers -ErrorAction Stop
        }
    } catch {
        return $null
    }
}

# 1. AUTENTICACIÓN
Write-Host "1. Autenticando..." -ForegroundColor Yellow
$auth = Invoke-SafeRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $credentials
if (-not $auth) { Write-Host "Error de autenticación"; exit 1 }

$headers = @{ "Authorization" = "Bearer $($auth.token)" }
Write-Host "Autenticado correctamente" -ForegroundColor Green

# 2. CREAR PRODUCTO BASE
Write-Host "2. Creando producto base..." -ForegroundColor Yellow
$productData = @{
    name = "Producto Test Relación"
    base_sku = "TEST-REL-001"
    description = "Producto para probar relación con variantes"
    department_id = 1
    subdepartment_id = 1
    brand_id = 1
    status = "active"
} | ConvertTo-Json

$product = Invoke-SafeRequest -Uri "$baseUrl/api/products" -Method POST -Body $productData -Headers $headers
if (-not $product) { Write-Host "Error creando producto"; exit 1 }

Write-Host "Producto creado:" -ForegroundColor Green
Write-Host "   ID: $($product.id)" -ForegroundColor Cyan
Write-Host "   Nombre: $($product.name)" -ForegroundColor Cyan
Write-Host "   SKU Base: $($product.base_sku)" -ForegroundColor Cyan

# 3. CREAR VARIANTES PARA EL PRODUCTO
Write-Host "3. Creando variantes..." -ForegroundColor Yellow

# Variante 1 - Básica
$variant1Data = @{
    product_id = $product.id
    sku = "$($product.base_sku)-BASIC"
    price = 25.99
    stock = 100
    attribute_values = @()
} | ConvertTo-Json

$variant1 = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $variant1Data -Headers $headers

# Variante 2 - Con precio diferente
$variant2Data = @{
    product_id = $product.id
    sku = "$($product.base_sku)-PREMIUM"
    price = 35.99
    stock = 50
    attribute_values = @()
} | ConvertTo-Json

$variant2 = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $variant2Data -Headers $headers

if ($variant1 -and $variant2) {
    Write-Host "2 variantes creadas exitosamente" -ForegroundColor Green
} else {
    Write-Host "Error creando variantes" -ForegroundColor Red
}

# 4. OBTENER VARIANTES POR PRODUCTO (CON FILTRO)
Write-Host "4. Obteniendo variantes del producto $($product.id)..." -ForegroundColor Yellow
$productVariants = Invoke-SafeRequest -Uri "$baseUrl/api/variants?product_id=$($product.id)" -Headers $headers

if ($productVariants) {
    Write-Host "Variantes del producto encontradas: $($productVariants.Count)" -ForegroundColor Green
    foreach ($v in $productVariants) {
        Write-Host "   SKU: $($v.sku) | Precio: $($v.price) | Stock: $($v.stock)" -ForegroundColor Cyan
    }
} else {
    Write-Host "Error obteniendo variantes del producto" -ForegroundColor Red
}

# 5. OBTENER TODAS LAS VARIANTES (SIN FILTRO)
Write-Host "5. Obteniendo TODAS las variantes..." -ForegroundColor Yellow
$allVariants = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Headers $headers

if ($allVariants) {
    Write-Host "Total de variantes en sistema: $($allVariants.Count)" -ForegroundColor Green
    $myProductVariants = $allVariants | Where-Object { $_.product_id -eq $product.id }
    Write-Host "   De mi producto: $($myProductVariants.Count)" -ForegroundColor Cyan
} else {
    Write-Host "Error obteniendo todas las variantes" -ForegroundColor Red
}

# 6. RESUMEN
Write-Host "RESUMEN - RELACIÓN PRODUCTO-VARIANTES" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor White
Write-Host "Producto creado con ID: $($product.id)" -ForegroundColor Green
Write-Host "Campo product_id en variantes establece la relación" -ForegroundColor Green
Write-Host "Endpoint GET /api/variants?product_id=X filtra por producto" -ForegroundColor Green
Write-Host "Endpoint GET /api/variants obtiene todas las variantes" -ForegroundColor Green

Write-Host "CÓMO USAR:" -ForegroundColor Cyan
Write-Host "1. Al crear variante: especifica product_id en el JSON" -ForegroundColor White
Write-Host "2. Para variantes de UN producto: GET /api/variants?product_id=123" -ForegroundColor White
Write-Host "3. Para TODAS las variantes: GET /api/variants" -ForegroundColor White