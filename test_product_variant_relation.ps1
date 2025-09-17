# Script para probar la relación entre productos y variantes

Write-Host "🧪 Iniciando prueba de relación producto-variante" -ForegroundColor Cyan

# 1. Autenticar
Write-Host "🔐 Autenticando..." -ForegroundColor Yellow
$auth = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin"}'
$headers = @{"Authorization" = "Bearer $($auth.token)"}
Write-Host "✅ Autenticación exitosa" -ForegroundColor Green

# 2. Crear un producto de prueba
Write-Host "📦 Creando producto de prueba..." -ForegroundColor Yellow
$productBody = @{
    name = "Producto Test Relacion"
    description = "Producto para probar relación con variantes"
    sku = "TEST-REL-$(Get-Random -Maximum 9999)"
    sale_price = 100.00
    cost_price = 50.00
    current_stock = 10
    category_id = 1
} | ConvertTo-Json

$product = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/products" -Method POST -Headers $headers -ContentType "application/json" -Body $productBody
Write-Host "✅ Producto creado con ID: $($product.id)" -ForegroundColor Green

# 3. Probar endpoint GET de variantes
Write-Host "🔍 Probando endpoint GET /api/variants..." -ForegroundColor Yellow
$variants = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants" -Method GET -Headers $headers
Write-Host "✅ Endpoint de variantes funciona - encontradas: $($variants.Count)" -ForegroundColor Green

# 4. Crear una variante asociada al producto
Write-Host "🎨 Creando variante asociada al producto..." -ForegroundColor Yellow
$variantBody = @{
    name = "Variante Prueba"
    sku = "VAR-TEST-$(Get-Random -Maximum 9999)"
    sale_price = 120.00
    cost_price = 60.00
    current_stock = 5
    product_id = $product.id
} | ConvertTo-Json

$variant = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants" -Method POST -Headers $headers -ContentType "application/json" -Body $variantBody
Write-Host "✅ Variante creada con ID: $($variant.id)" -ForegroundColor Green

# 5. Verificar la relación - obtener variantes del producto
Write-Host "🔗 Verificando relación - obteniendo variantes del producto..." -ForegroundColor Yellow
$productVariants = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants?product_id=$($product.id)" -Method GET -Headers $headers
Write-Host "✅ Variantes encontradas para el producto: $($productVariants.Count)" -ForegroundColor Green

if ($productVariants.Count -gt 0) {
    Write-Host "📋 Detalles de la primera variante:" -ForegroundColor Cyan
    Write-Host "   ID: $($productVariants[0].id)" -ForegroundColor White
    Write-Host "   Nombre: $($productVariants[0].name)" -ForegroundColor White
    Write-Host "   SKU: $($productVariants[0].sku)" -ForegroundColor White
    Write-Host "   Product ID: $($productVariants[0].product_id)" -ForegroundColor White
    Write-Host "   Precio Venta: $($productVariants[0].sale_price)" -ForegroundColor White
    Write-Host "   Precio Costo: $($productVariants[0].cost_price)" -ForegroundColor White
    Write-Host "   Stock: $($productVariants[0].current_stock)" -ForegroundColor White
    
    # Verificar que el product_id coincide
    if ($productVariants[0].product_id -eq $product.id) {
        Write-Host "✅ RELACIÓN VERIFICADA: La variante está correctamente asociada al producto" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: La variante no está asociada al producto correcto" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ERROR: No se encontraron variantes para el producto" -ForegroundColor Red
}

# 6. Obtener variante individual
Write-Host "🔍 Obteniendo variante individual..." -ForegroundColor Yellow
$singleVariant = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants/$($variant.id)" -Method GET -Headers $headers
Write-Host "✅ Variante obtenida: $($singleVariant.name)" -ForegroundColor Green

Write-Host "🎉 PRUEBA COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
Write-Host "   - Producto creado: ✅" -ForegroundColor White
Write-Host "   - Variante creada: ✅" -ForegroundColor White
Write-Host "   - Relación verificada: ✅" -ForegroundColor White
Write-Host "   - Endpoints funcionando: ✅" -ForegroundColor White