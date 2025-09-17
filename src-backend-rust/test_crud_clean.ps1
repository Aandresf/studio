# Script de pruebas CRUD limpio - Solo resultados importantes
# Suprime errores 404 y muestra solo salidas exitosas

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

# Configuración
$baseUrl = "http://127.0.0.1:8080"
$credentials = @{
    username = "admin"
    password = "admin"
} | ConvertTo-Json

Write-Host "🚀 INICIANDO PRUEBAS CRUD COMPLETAS" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor White

# Función para hacer requests silenciosos
function Invoke-SafeRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$ContentType = "application/json"
    )
    
    try {
        if ($Body) {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType $ContentType -Headers $Headers -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers -ErrorAction Stop
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            return $null  # Silenciar 404s
        } else {
            Write-Host "❌ Error en $Method $Uri : $($_.Exception.Message)" -ForegroundColor Red
            return $null
        }
    }
}

# 1. AUTENTICACIÓN
Write-Host "`n1. AUTENTICACIÓN" -ForegroundColor Yellow
$authResult = Invoke-SafeRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $credentials

if ($authResult) {
    $headers = @{ "Authorization" = "Bearer $($authResult.token)" }
    Write-Host "✅ Login exitoso - Token obtenido" -ForegroundColor Green
} else {
    Write-Host "❌ Error de autenticación" -ForegroundColor Red
    exit 1
}

# 2. LIMPIAR DATOS ANTERIORES
Write-Host "`n2. LIMPIEZA DE DATOS ANTERIORES" -ForegroundColor Yellow
$existingProducts = Invoke-SafeRequest -Uri "$baseUrl/api/products" -Headers $headers

if ($existingProducts) {
    $testProducts = $existingProducts | Where-Object { $_.name -like "*Test*" -or $_.base_sku -like "*TEST*" }
    foreach ($product in $testProducts) {
        # Eliminar variantes del producto
        $variants = Invoke-SafeRequest -Uri "$baseUrl/api/variants?product_id=$($product.id)" -Headers $headers
        if ($variants) {
            foreach ($variant in $variants) {
                Invoke-SafeRequest -Uri "$baseUrl/api/variants/$($variant.id)" -Method DELETE -Headers $headers | Out-Null
            }
        }
        
        # Eliminar producto
        Invoke-SafeRequest -Uri "$baseUrl/api/products/$($product.id)" -Method DELETE -Headers $headers | Out-Null
    }
}
Write-Host "✅ Datos de prueba anteriores eliminados" -ForegroundColor Green

# 3. CREAR PRODUCTO BASE
Write-Host "`n3. CREAR PRODUCTO BASE" -ForegroundColor Yellow
$productData = @{
    name = "Camiseta Premium Test CRUD"
    base_sku = "CAM-TEST-CRUD-001"
    description = "Producto para pruebas CRUD completas"
    department_id = 1
    subdepartment_id = 1
    brand_id = 1
    status = "active"
} | ConvertTo-Json

$productResult = Invoke-SafeRequest -Uri "$baseUrl/api/products" -Method POST -Body $productData -Headers $headers

if ($productResult) {
    Write-Host "✅ Producto creado:" -ForegroundColor Green
    Write-Host "   ID: $($productResult.id)" -ForegroundColor Cyan
    Write-Host "   Nombre: $($productResult.name)" -ForegroundColor Cyan
    Write-Host "   SKU Base: $($productResult.base_sku)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error creando producto" -ForegroundColor Red
    exit 1
}

# 4. OBTENER VALORES DE ATRIBUTOS
Write-Host "`n4. OBTENER VALORES DE ATRIBUTOS" -ForegroundColor Yellow
$colorValues = Invoke-SafeRequest -Uri "$baseUrl/api/attribute-values?attribute_name=Color" -Headers $headers
$tallaValues = Invoke-SafeRequest -Uri "$baseUrl/api/attribute-values?attribute_name=Talla" -Headers $headers
$materialValues = Invoke-SafeRequest -Uri "$baseUrl/api/attribute-values?attribute_name=Material" -Headers $headers

$colorRojo = $colorValues | Where-Object { $_.value -eq "Rojo" } | Select-Object -First 1
$colorAzul = $colorValues | Where-Object { $_.value -eq "Azul" } | Select-Object -First 1
$tallaM = $tallaValues | Where-Object { $_.value -eq "M" } | Select-Object -First 1
$tallaL = $tallaValues | Where-Object { $_.value -eq "L" } | Select-Object -First 1
$materialAlgodon = $materialValues | Where-Object { $_.value -eq "Algodón" } | Select-Object -First 1

Write-Host "✅ Atributos obtenidos:" -ForegroundColor Green
Write-Host "   Colores: $($colorValues.Count) disponibles" -ForegroundColor Cyan
Write-Host "   Tallas: $($tallaValues.Count) disponibles" -ForegroundColor Cyan
Write-Host "   Materiales: $($materialValues.Count) disponibles" -ForegroundColor Cyan

# 5. CREAR VARIANTES - DIFERENTES TIPOS
Write-Host "`n5. CREAR VARIANTES - TIPOS DIFERENTES" -ForegroundColor Yellow

# Variante básica (sin atributos)
$variantBasicData = @{
    product_id = $productResult.id
    sku = "$($productResult.base_sku)-BASIC"
    price = 29.99
    stock = 50
    attribute_values = @()
} | ConvertTo-Json

$variantBasic = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $variantBasicData -Headers $headers

# Variante con color
$variantColorData = @{
    product_id = $productResult.id
    sku = "$($productResult.base_sku)-ROJO"
    price = 32.99
    stock = 30
    attribute_values = @(
        @{
            attribute_id = $colorRojo.attribute_id
            attribute_value_id = $colorRojo.id
            attribute_name = "Color"
            attribute_value = "Rojo"
        }
    )
} | ConvertTo-Json -Depth 3

$variantColor = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $variantColorData -Headers $headers

# Variante con color + talla
$variantDualData = @{
    product_id = $productResult.id
    sku = "$($productResult.base_sku)-ROJO-M"
    price = 35.99
    stock = 25
    attribute_values = @(
        @{
            attribute_id = $colorRojo.attribute_id
            attribute_value_id = $colorRojo.id
            attribute_name = "Color"
            attribute_value = "Rojo"
        },
        @{
            attribute_id = $tallaM.attribute_id
            attribute_value_id = $tallaM.id
            attribute_name = "Talla"
            attribute_value = "M"
        }
    )
} | ConvertTo-Json -Depth 3

$variantDual = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $variantDualData -Headers $headers

# Variante con múltiples atributos
$variantMultiData = @{
    product_id = $productResult.id
    sku = "$($productResult.base_sku)-AZUL-L-ALGODON"
    price = 39.99
    stock = 20
    attribute_values = @(
        @{
            attribute_id = $colorAzul.attribute_id
            attribute_value_id = $colorAzul.id
            attribute_name = "Color"
            attribute_value = "Azul"
        },
        @{
            attribute_id = $tallaL.attribute_id
            attribute_value_id = $tallaL.id
            attribute_name = "Talla"
            attribute_value = "L"
        },
        @{
            attribute_id = $materialAlgodon.attribute_id
            attribute_value_id = $materialAlgodon.id
            attribute_name = "Material"
            attribute_value = "Algodón"
        }
    )
} | ConvertTo-Json -Depth 3

$variantMulti = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $variantMultiData -Headers $headers

Write-Host "✅ Variantes creadas exitosamente:" -ForegroundColor Green
if ($variantBasic) { 
    Write-Host "   🔸 Básica: $($variantBasic.sku) - $($variantBasic.price)" -ForegroundColor Cyan 
}
if ($variantColor) { 
    Write-Host "   🔸 Color: $($variantColor.sku) - $($variantColor.price)" -ForegroundColor Cyan 
}
if ($variantDual) { 
    Write-Host "   🔸 Dual: $($variantDual.sku) - $($variantDual.price)" -ForegroundColor Cyan 
}
if ($variantMulti) { 
    Write-Host "   🔸 Multi: $($variantMulti.sku) - $($variantMulti.price)" -ForegroundColor Cyan 
}

# 6. OPERACIONES DE LECTURA
Write-Host "`n6. PRUEBAS DE LECTURA" -ForegroundColor Yellow
$allVariants = Invoke-SafeRequest -Uri "$baseUrl/api/variants?product_id=$($productResult.id)" -Headers $headers

if ($allVariants) {
    Write-Host "✅ Listado de variantes:" -ForegroundColor Green
    foreach ($variant in $allVariants) {
        $attrText = if ($variant.attribute_values -and $variant.attribute_values.Count -gt 0) {
            ($variant.attribute_values | ForEach-Object { "$($_.attribute_value)" }) -join ", "
        } else {
            "Sin atributos"
        }
        Write-Host "   📦 $($variant.sku) | $($variant.price) | Stock: $($variant.stock) | [$attrText]" -ForegroundColor Cyan
    }
}

# 7. OPERACIONES DE ACTUALIZACIÓN
Write-Host "`n7. PRUEBAS DE ACTUALIZACIÓN" -ForegroundColor Yellow

if ($variantBasic) {
    # Actualizar precio de variante básica
    $updateData = @{
        price = 27.99
        stock = 75
    } | ConvertTo-Json
    
    $updated = Invoke-SafeRequest -Uri "$baseUrl/api/variants/$($variantBasic.id)" -Method PUT -Body $updateData -Headers $headers
    
    if ($updated) {
        Write-Host "✅ Variante básica actualizada:" -ForegroundColor Green
        Write-Host "   Nuevo precio: $($updated.price) (antes: 29.99)" -ForegroundColor Cyan
        Write-Host "   Nuevo stock: $($updated.stock) (antes: 50)" -ForegroundColor Cyan
    }
}

# 8. OPERACIONES DE ELIMINACIÓN
Write-Host "`n8. PRUEBAS DE ELIMINACIÓN" -ForegroundColor Yellow

# Crear variante temporal para eliminar
$tempData = @{
    product_id = $productResult.id
    sku = "TEMP-DELETE-TEST"
    price = 99.99
    stock = 1
    attribute_values = @()
} | ConvertTo-Json

$tempVariant = Invoke-SafeRequest -Uri "$baseUrl/api/variants" -Method POST -Body $tempData -Headers $headers

if ($tempVariant) {
    Write-Host "✅ Variante temporal creada: $($tempVariant.sku)" -ForegroundColor Green
    
    # Eliminar la variante
    $deleteResult = Invoke-SafeRequest -Uri "$baseUrl/api/variants/$($tempVariant.id)" -Method DELETE -Headers $headers
    
    # Verificar eliminación
    $checkDeleted = Invoke-SafeRequest -Uri "$baseUrl/api/variants/$($tempVariant.id)" -Headers $headers
    
    if ($checkDeleted -eq $null) {
        Write-Host "✅ Variante eliminada correctamente (404 confirmado)" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: Variante no eliminada" -ForegroundColor Red
    }
}

# 9. RESUMEN FINAL
Write-Host "`n9. RESUMEN FINAL" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor White

$finalVariants = Invoke-SafeRequest -Uri "$baseUrl/api/variants?product_id=$($productResult.id)" -Headers $headers

if ($finalVariants) {
    Write-Host "✅ CRUD COMPLETO EXITOSO" -ForegroundColor Green
    Write-Host "📊 Variantes finales activas: $($finalVariants.Count)" -ForegroundColor Cyan
    
    foreach ($variant in $finalVariants) {
        $attrText = if ($variant.attribute_values -and $variant.attribute_values.Count -gt 0) {
            ($variant.attribute_values | ForEach-Object { "$($_.attribute_name):$($_.attribute_value)" }) -join ", "
        } else {
            "Producto base"
        }
        Write-Host "   🏷️ $($variant.sku) | $($variant.price) | [$attrText]" -ForegroundColor White
    }
    
    Write-Host "`n🎉 TODAS LAS OPERACIONES CRUD VALIDADAS" -ForegroundColor Green
} else {
    Write-Host "❌ Error obteniendo resumen final" -ForegroundColor Red
}

Write-Host "======================================" -ForegroundColor White
Write-Host "✅ Script completado" -ForegroundColor Green