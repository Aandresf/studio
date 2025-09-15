// src-backend-rust/src/config.rs

use serde::Deserialize;
use std::path::PathBuf;

#[derive(Deserialize, Debug, Clone)]
pub struct Settings {
    pub host: String,
    pub port: u16,
    pub data_dir: PathBuf,
}

impl Settings {
    pub fn new() -> Result<Self, config::ConfigError> {
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let s = config::Config::builder()
            // Empezar con valores por defecto
            .set_default("host", "127.0.0.1")?
            .set_default("port", 8080)?
            .set_default("data_dir", "./data")?
            
            // Sobrescribir con un archivo de configuración (ej. `config/development.toml`)
            .add_source(config::File::with_name(&format!("config/{}", run_mode)).required(false))
            
            // Sobrescribir con variables de entorno (ej. `APP_HOST=0.0.0.0`)
            .add_source(config::Environment::with_prefix("APP"))
            .build()?;

        s.try_deserialize()
    }
}