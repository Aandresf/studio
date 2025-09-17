# Script simple para probar endpoints de variantes

Write-Host "🧪 Prueba rápida de endpoints" -ForegroundColor Cyan

# Autenticar
$auth = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin"}'
$headers = @{"Authorization" = "Bearer $($auth.token)"}
Write-Host "✅ Autenticado" -ForegroundColor Green

# Probar endpoint de variantes
try {
    $variants = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants" -Method GET -Headers $headers
    Write-Host "✅ Endpoint /api/variants funciona - Total: $($variants.Count)" -ForegroundColor Green
    
    # Crear producto
    $productBody = @{
        name = "Test Product"
        description = "Test"
        sku = "TEST-$(Get-Random)"
        sale_price = 100.0
        cost_price = 50.0
        current_stock = 10
        category_id = 1
    } | ConvertTo-Json
    
    $product = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/products" -Method POST -Headers $headers -ContentType "application/json" -Body $productBody
    Write-Host "✅ Producto creado: ID $($product.id)" -ForegroundColor Green
    
    # Crear variante
    $variantBody = @{
        name = "Test Variant"
        sku = "VAR-$(Get-Random)"
        sale_price = 120.0
        cost_price = 60.0
        current_stock = 5
        product_id = $product.id
    } | ConvertTo-Json
    
    $variant = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants" -Method POST -Headers $headers -ContentType "application/json" -Body $variantBody
    Write-Host "✅ Variante creada: ID $($variant.id)" -ForegroundColor Green
    
    # Verificar relación
    $productVariants = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/variants?product_id=$($product.id)" -Method GET -Headers $headers
    Write-Host "✅ Variantes del producto: $($productVariants.Count)" -ForegroundColor Green
    
    if ($productVariants.Count -gt 0 -and $productVariants[0].product_id -eq $product.id) {
        Write-Host "🎉 RELACIÓN PRODUCTO-VARIANTE FUNCIONA CORRECTAMENTE" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}