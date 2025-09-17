# Script para probar variantes con schema corregido
$baseUrl = "http://127.0.0.1:8080"

Write-Host "Iniciando servidor backend..." -ForegroundColor Yellow
Start-Process -FilePath "cargo" -ArgumentList "run" -WorkingDirectory "C:\PROGRAMACION\INVENTARIO\studio\src-backend-rust" -WindowStyle Minimized

# Esperar a que el servidor inicie
Start-Sleep -Seconds 5

# Autenticación
$auth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin"}'
$headers = @{ "Authorization" = "Bearer $($auth.token)" }

Write-Host "Autenticado correctamente" -ForegroundColor Green

# Crear producto
$productData = @{
    name = "Producto Schema Test"
    base_sku = "SCHEMA-TEST-001"
    description = "Prueba con schema corregido"
    department_id = 1
    subdepartment_id = 1
    brand_id = 1
} | ConvertTo-Json

$product = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method POST -ContentType "application/json" -Headers $headers -Body $productData

Write-Host "Producto creado: $($product.name) (ID: $($product.id))" -ForegroundColor Green

# Crear variante con nuevos campos del schema
$variantData = @{
    product_id = $product.id
    sku = "$($product.base_sku)-V1"
    sale_price = 29.99
    cost_price = 15.50
    current_stock = 100.0
    attribute_values = @()
} | ConvertTo-Json

$variant = Invoke-RestMethod -Uri "$baseUrl/api/variants" -Method POST -ContentType "application/json" -Headers $headers -Body $variantData

Write-Host "Variante creada exitosamente:" -ForegroundColor Green
Write-Host "  SKU: $($variant.sku)" -ForegroundColor Cyan
Write-Host "  Precio venta: $($variant.sale_price)" -ForegroundColor Cyan
Write-Host "  Precio costo: $($variant.cost_price)" -ForegroundColor Cyan
Write-Host "  Stock actual: $($variant.current_stock)" -ForegroundColor Cyan

# Obtener variantes del producto
$variants = Invoke-RestMethod -Uri "$baseUrl/api/variants?product_id=$($product.id)" -Headers $headers

Write-Host "Variantes del producto ($($variants.Count)):" -ForegroundColor Green
foreach ($v in $variants) {
    Write-Host "  $($v.sku) | Venta: $($v.sale_price) | Costo: $($v.cost_price) | Stock: $($v.current_stock)" -ForegroundColor Cyan
}

Write-Host "Prueba completada - Schema corregido funcionando!" -ForegroundColor Green