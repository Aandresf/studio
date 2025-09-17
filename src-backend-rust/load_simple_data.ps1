# Script simplificado para cargar datos de prueba
Write-Host "=== INICIANDO CARGA DE DATOS DE PRUEBA ===" -ForegroundColor Green

# Funcion para hacer requests con manejo de errores
function Post-Data {
    param(
        [string]$Uri,
        [string]$Body,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    Write-Host "`n--- $Description ---" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $Uri -Method POST -ContentType "application/json" -Body $Body -Headers $Headers -UseBasicParsing
        $content = $response.Content | ConvertFrom-Json
        Write-Host "SUCCESS: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor DarkGreen
        return $content
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Login
Write-Host "`n=== 1. LOGIN ===" -ForegroundColor Cyan
$loginBody = '{"username":"admin","password":"admin"}'
$loginResult = Post-Data -Uri "http://localhost:8080/api/auth/login" -Body $loginBody -Description "Login admin"

if (-not $loginResult -or -not $loginResult.token) {
    Write-Host "FALLO EN LOGIN. Abortando." -ForegroundColor Red
    exit 1
}

$token = $loginResult.token
$authHeaders = @{ "Authorization" = "Bearer $token" }
Write-Host "Token obtenido exitosamente" -ForegroundColor Green

# 2. Crear Departamentos
Write-Host "`n=== 2. DEPARTAMENTOS ===" -ForegroundColor Cyan

$dept1 = Post-Data -Uri "http://localhost:8080/api/departments" -Body '{"name":"MODA FEMENINA","abbreviation":"MF"}' -Headers $authHeaders -Description "Crear MODA FEMENINA"
$dept2 = Post-Data -Uri "http://localhost:8080/api/departments" -Body '{"name":"PERFUMERIA","abbreviation":"PF"}' -Headers $authHeaders -Description "Crear PERFUMERIA"
$dept3 = Post-Data -Uri "http://localhost:8080/api/departments" -Body '{"name":"ACCESORIOS","abbreviation":"AC"}' -Headers $authHeaders -Description "Crear ACCESORIOS"
$dept4 = Post-Data -Uri "http://localhost:8080/api/departments" -Body '{"name":"JOYERIA","abbreviation":"JY"}' -Headers $authHeaders -Description "Crear JOYERIA"

# 3. Crear Subdepartamentos (necesitamos los IDs de departamentos)
Write-Host "`n=== 3. SUBDEPARTAMENTOS ===" -ForegroundColor Cyan

if ($dept1 -and $dept1.id) {
    $subdept1 = Post-Data -Uri "http://localhost:8080/api/departments/$($dept1.id)/subdepartments" -Body "{`"name`":`"Vestidos`",`"abbreviation`":`"VES`"}" -Headers $authHeaders -Description "Crear Vestidos"
    $subdept2 = Post-Data -Uri "http://localhost:8080/api/departments/$($dept1.id)/subdepartments" -Body "{`"name`":`"Blusas`",`"abbreviation`":`"BLU`"}" -Headers $authHeaders -Description "Crear Blusas"
}

if ($dept2 -and $dept2.id) {
    $subdept3 = Post-Data -Uri "http://localhost:8080/api/departments/$($dept2.id)/subdepartments" -Body "{`"name`":`"Fragancias Femeninas`",`"abbreviation`":`"FRF`"}" -Headers $authHeaders -Description "Crear Fragancias Femeninas"
}

if ($dept3 -and $dept3.id) {
    $subdept4 = Post-Data -Uri "http://localhost:8080/api/departments/$($dept3.id)/subdepartments" -Body "{`"name`":`"Bolsos`",`"abbreviation`":`"BOL`"}" -Headers $authHeaders -Description "Crear Bolsos"
}

if ($dept4 -and $dept4.id) {
    $subdept5 = Post-Data -Uri "http://localhost:8080/api/departments/$($dept4.id)/subdepartments" -Body "{`"name`":`"Collares`",`"abbreviation`":`"COL`"}" -Headers $authHeaders -Description "Crear Collares"
}

# 4. Crear Marcas
Write-Host "`n=== 4. MARCAS ===" -ForegroundColor Cyan

if ($subdept1 -and $subdept1.id) {
    $brand1 = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Zara`",`"subdepartment_id`":$($subdept1.id)}" -Headers $authHeaders -Description "Crear marca Zara"
}

if ($subdept2 -and $subdept2.id) {
    $brand2 = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"HM`",`"subdepartment_id`":$($subdept2.id)}" -Headers $authHeaders -Description "Crear marca HM"
}

if ($subdept3 -and $subdept3.id) {
    $brand3 = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Chanel`",`"subdepartment_id`":$($subdept3.id)}" -Headers $authHeaders -Description "Crear marca Chanel"
}

if ($subdept4 -and $subdept4.id) {
    $brand4 = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Michael Kors`",`"subdepartment_id`":$($subdept4.id)}" -Headers $authHeaders -Description "Crear marca Michael Kors"
}

if ($subdept5 -and $subdept5.id) {
    $brand5 = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Pandora`",`"subdepartment_id`":$($subdept5.id)}" -Headers $authHeaders -Description "Crear marca Pandora"
}

# 5. Crear Atributos
Write-Host "`n=== 5. ATRIBUTOS ===" -ForegroundColor Cyan

if ($subdept1 -and $subdept1.id) {
    $attr1 = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Talla`",`"subdepartment_id`":$($subdept1.id)}" -Headers $authHeaders -Description "Crear atributo Talla"
    $attr2 = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Color`",`"subdepartment_id`":$($subdept1.id)}" -Headers $authHeaders -Description "Crear atributo Color"
}

if ($subdept3 -and $subdept3.id) {
    $attr3 = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Volumen`",`"subdepartment_id`":$($subdept3.id)}" -Headers $authHeaders -Description "Crear atributo Volumen"
}

if ($subdept5 -and $subdept5.id) {
    $attr4 = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Material`",`"subdepartment_id`":$($subdept5.id)}" -Headers $authHeaders -Description "Crear atributo Material"
}

# 6. Crear Valores de Atributos
Write-Host "`n=== 6. VALORES DE ATRIBUTOS ===" -ForegroundColor Cyan

if ($attr1 -and $attr1.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr1.id),`"value`":`"S`"}" -Headers $authHeaders -Description "Valor S para Talla" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr1.id),`"value`":`"M`"}" -Headers $authHeaders -Description "Valor M para Talla" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr1.id),`"value`":`"L`"}" -Headers $authHeaders -Description "Valor L para Talla" | Out-Null
}

if ($attr2 -and $attr2.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr2.id),`"value`":`"Negro`"}" -Headers $authHeaders -Description "Valor Negro para Color" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr2.id),`"value`":`"Blanco`"}" -Headers $authHeaders -Description "Valor Blanco para Color" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr2.id),`"value`":`"Rojo`"}" -Headers $authHeaders -Description "Valor Rojo para Color" | Out-Null
}

if ($attr3 -and $attr3.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr3.id),`"value`":`"50ml`"}" -Headers $authHeaders -Description "Valor 50ml para Volumen" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr3.id),`"value`":`"100ml`"}" -Headers $authHeaders -Description "Valor 100ml para Volumen" | Out-Null
}

if ($attr4 -and $attr4.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr4.id),`"value`":`"Oro`"}" -Headers $authHeaders -Description "Valor Oro para Material" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attr4.id),`"value`":`"Plata`"}" -Headers $authHeaders -Description "Valor Plata para Material" | Out-Null
}

# 7. Crear Clientes
Write-Host "`n=== 7. CLIENTES ===" -ForegroundColor Cyan

Post-Data -Uri "http://localhost:8080/api/customers" -Body '{"name":"Maria Garcia","document":"12345678A","email":"maria@email.com","phone":"600123456","address":"Calle Mayor 123"}' -Headers $authHeaders -Description "Cliente Maria Garcia" | Out-Null

Post-Data -Uri "http://localhost:8080/api/customers" -Body '{"name":"Carlos Lopez","document":"87654321B","email":"carlos@email.com","phone":"600234567","address":"Avenida Central 456"}' -Headers $authHeaders -Description "Cliente Carlos Lopez" | Out-Null

Post-Data -Uri "http://localhost:8080/api/customers" -Body '{"name":"Ana Martinez","document":"11223344C","email":"ana@email.com","phone":"600345678","address":"Plaza España 789"}' -Headers $authHeaders -Description "Cliente Ana Martinez" | Out-Null

Write-Host "`n=== CARGA COMPLETADA ===" -ForegroundColor Green
Write-Host "Datos de prueba cargados exitosamente!" -ForegroundColor Yellow