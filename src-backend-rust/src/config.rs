// src-backend-rust/src/config.rs

use serde::Deserialize;
use std::path::{PathBuf, Path};
use std::env;
use std::io;

#[derive(Deserialize, Debug, Clone)]
pub struct Settings {
    pub host: String,
    pub port: u16,
    pub data_dir: PathBuf,
    pub db_path: String,
    pub jwt_secret: String,
}

impl Settings {
    pub fn new() -> Result<Self, config::ConfigError> {
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let s = config::Config::builder()
            // Empezar con valores por defecto
            .set_default("host", "127.0.0.1")?
            .set_default("port", 8080)?
            .set_default("data_dir", "./data")?
            .set_default("db_path", "./data/database.db")?
            .set_default("jwt_secret", "insecure_development_secret")?
            
            // Sobrescribir con un archivo de configuración (ej. `config/development.toml`)
            .add_source(config::File::with_name(&format!("config/{}", run_mode)).required(false))
            
            // Sobrescribir con variables de entorno (ej. `APP_HOST=0.0.0.0`)
            .add_source(config::Environment::with_prefix("APP"))
            .build()?;

        let mut settings: Settings = s.try_deserialize()?;
        
        // Asegurar que las rutas relativas sean absolutas
        if !Path::new(&settings.db_path).is_absolute() {
            let current_dir = std::env::current_dir()
                .map_err(|e| config::ConfigError::Message(format!("Error obteniendo directorio actual: {}", e)))?;
            settings.db_path = current_dir.join(settings.db_path).to_string_lossy().into_owned();
        }
        
        Ok(settings)
    }
}

// Función para obtener el directorio de datos
// Esta función es usada por módulos que necesitan acceso al sistema de archivos
pub fn get_data_dir() -> Result<PathBuf, io::Error> {
    // Intentar obtener del entorno
    if let Ok(dir) = env::var("APP_DATA_DIR") {
        let path = PathBuf::from(dir);
        return Ok(path);
    }
    
    // Utilizar el directorio actual + /data como fallback
    let current_dir = env::current_dir()?;
    Ok(current_dir.join("data"))
}