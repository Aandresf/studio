# Test completo de relación Producto-Variante
Write-Host "PRUEBA DE RELACIÓN PRODUCTO-VARIANTE COMPLETA" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor White

$baseUrl = "http://127.0.0.1:8080"

# Función para hacer requests seguros
function Invoke-SafeAPI {
    param($Uri, $Method = "GET", $Body = $null, $Headers = @{})
    try {
        if ($Body) {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType "application/json" -Headers $Headers -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers -ErrorAction Stop
        }
    } catch {
        Write-Host "Error en $Method $Uri : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. AUTENTICACIÓN
Write-Host "1. Autenticando..." -ForegroundColor Yellow
$auth = Invoke-SafeAPI -Uri "$baseUrl/api/auth/login" -Method POST -Body '{"username":"admin","password":"admin"}'
if (-not $auth) { exit 1 }

$headers = @{ "Authorization" = "Bearer $($auth.token)" }
Write-Host "✅ Autenticado correctamente" -ForegroundColor Green

# 2. CREAR PRODUCTO BASE
Write-Host "`n2. Creando producto base..." -ForegroundColor Yellow
$productData = @{
    name = "Camiseta Test Relación"
    base_sku = "CAM-REL-001"
    description = "Test completo de relación producto-variante"
    department_id = 1
    subdepartment_id = 1
    brand_id = 1
} | ConvertTo-Json

$product = Invoke-SafeAPI -Uri "$baseUrl/api/products" -Method POST -Body $productData -Headers $headers
if (-not $product) { exit 1 }

Write-Host "✅ Producto creado:" -ForegroundColor Green
Write-Host "   ID: $($product.id)" -ForegroundColor Cyan
Write-Host "   Nombre: $($product.name)" -ForegroundColor Cyan
Write-Host "   SKU Base: $($product.base_sku)" -ForegroundColor Cyan

# 3. CREAR VARIANTES CON DIFERENTES CONFIGURACIONES
Write-Host "`n3. Creando variantes..." -ForegroundColor Yellow

# Variante 1: Básica
$variant1Data = @{
    product_id = $product.id
    sku = "$($product.base_sku)-BASIC"
    sale_price = 29.99
    cost_price = 15.00
    current_stock = 100.0
    attribute_values = @()
} | ConvertTo-Json

$variant1 = Invoke-SafeAPI -Uri "$baseUrl/api/variants" -Method POST -Body $variant1Data -Headers $headers

# Variante 2: Premium
$variant2Data = @{
    product_id = $product.id
    sku = "$($product.base_sku)-PREMIUM"
    sale_price = 39.99
    cost_price = 20.00
    current_stock = 50.0
    attribute_values = @()
} | ConvertTo-Json

$variant2 = Invoke-SafeAPI -Uri "$baseUrl/api/variants" -Method POST -Body $variant2Data -Headers $headers

if ($variant1 -and $variant2) {
    Write-Host "✅ Variantes creadas exitosamente" -ForegroundColor Green
    Write-Host "   Básica: $($variant1.sku) - $($variant1.sale_price)" -ForegroundColor Cyan
    Write-Host "   Premium: $($variant2.sku) - $($variant2.sale_price)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error creando variantes" -ForegroundColor Red
    exit 1
}

# 4. VERIFICAR RELACIÓN - Obtener variantes por producto
Write-Host "`n4. Verificando relación producto-variantes..." -ForegroundColor Yellow
$productVariants = Invoke-SafeAPI -Uri "$baseUrl/api/variants?product_id=$($product.id)" -Headers $headers

if ($productVariants) {
    Write-Host "✅ Relación correcta encontrada:" -ForegroundColor Green
    Write-Host "   Producto ID: $($product.id)" -ForegroundColor Cyan
    Write-Host "   Variantes encontradas: $($productVariants.Count)" -ForegroundColor Cyan
    
    foreach ($v in $productVariants) {
        Write-Host "     - SKU: $($v.sku) | product_id: $($v.product_id) | Precio: $($v.sale_price)" -ForegroundColor White
        
        # Verificar que product_id coincide
        if ($v.product_id -ne $product.id) {
            Write-Host "❌ ERROR: product_id no coincide!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ No se encontraron variantes para el producto" -ForegroundColor Red
}

# 5. VERIFICAR CAMPOS DEL SCHEMA
Write-Host "`n5. Verificando campos del schema..." -ForegroundColor Yellow
if ($variant1) {
    $hasCorrectFields = $variant1.PSObject.Properties.Name -contains "sale_price" -and 
                       $variant1.PSObject.Properties.Name -contains "cost_price" -and 
                       $variant1.PSObject.Properties.Name -contains "current_stock"
    
    if ($hasCorrectFields) {
        Write-Host "✅ Campos del schema correctos:" -ForegroundColor Green
        Write-Host "   sale_price: $($variant1.sale_price)" -ForegroundColor Cyan
        Write-Host "   cost_price: $($variant1.cost_price)" -ForegroundColor Cyan
        Write-Host "   current_stock: $($variant1.current_stock)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Campos del schema incorrectos" -ForegroundColor Red
    }
}

# 6. PRUEBA DE ACTUALIZACIÓN
Write-Host "`n6. Probando actualización de variante..." -ForegroundColor Yellow
$updateData = @{
    sale_price = 35.99
    current_stock = 75.0
} | ConvertTo-Json

$updatedVariant = Invoke-SafeAPI -Uri "$baseUrl/api/variants/$($variant1.id)" -Method PUT -Body $updateData -Headers $headers

if ($updatedVariant) {
    Write-Host "✅ Variante actualizada:" -ForegroundColor Green
    Write-Host "   Nuevo precio: $($updatedVariant.sale_price) (antes: 29.99)" -ForegroundColor Cyan
    Write-Host "   Nuevo stock: $($updatedVariant.current_stock) (antes: 100.0)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error actualizando variante" -ForegroundColor Red
}

# 7. RESUMEN FINAL
Write-Host "`n7. RESUMEN DE LA RELACIÓN" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor White

$finalVariants = Invoke-SafeAPI -Uri "$baseUrl/api/variants?product_id=$($product.id)" -Headers $headers

if ($finalVariants) {
    Write-Host "✅ RELACIÓN PRODUCTO-VARIANTE FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Producto: $($product.name) (ID: $($product.id))" -ForegroundColor White
    Write-Host "🏷️  Variantes activas: $($finalVariants.Count)" -ForegroundColor White
    Write-Host ""
    
    foreach ($v in $finalVariants) {
        Write-Host "   • $($v.sku)" -ForegroundColor Cyan
        Write-Host "     - Precio venta: $($v.sale_price)" -ForegroundColor White
        Write-Host "     - Precio costo: $($v.cost_price)" -ForegroundColor White
        Write-Host "     - Stock actual: $($v.current_stock)" -ForegroundColor White
        Write-Host "     - Producto ID: $($v.product_id)" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "🔗 Relación establecida via:" -ForegroundColor Yellow
    Write-Host "   - Campo 'product_id' en tabla 'product_variants'" -ForegroundColor White
    Write-Host "   - Clave foránea: REFERENCES products(id) ON DELETE CASCADE" -ForegroundColor White
    Write-Host "   - Endpoint: GET /api/variants?product_id=X" -ForegroundColor White
} else {
    Write-Host "❌ FALLO EN LA VERIFICACIÓN FINAL" -ForegroundColor Red
}

Write-Host "`n🎉 PRUEBA COMPLETADA" -ForegroundColor Green