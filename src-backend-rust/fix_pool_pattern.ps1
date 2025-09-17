# Script PowerShell para corregir el patrón de get_pool() en archivos de rutas
param(
    [string]$FileName
)

# Leer el contenido del archivo
$content = Get-Content $FileName -Raw

# Patrón para buscar funciones con pool como parámetro
$functionPattern = '(async fn \w+[^{]*pool: web::Data<Arc<DatabaseManager>>[^{]*-> impl Responder \{[^}]*?)\s*match\s+(\w+::\w+)\(&pool\.get_pool\(\),'

# Plantilla de reemplazo
$replacement = @'
$1
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match $2(&pool,
'@

# Aplicar el patrón usando regex
$content = [regex]::Replace($content, $functionPattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# También corregir llamadas sueltas que no fueron capturadas
$content = $content -replace '&pool\.get_pool\(\)', '&pool'

# Escribir el archivo corregido
Set-Content -Path $FileName -Value $content -NoNewline

Write-Host "Archivo $FileName corregido"