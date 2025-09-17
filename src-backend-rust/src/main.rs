// src-backend-rust/src/main.rs

// Importamos los módulos y librerías necesarios
use actix_web::{web, App, HttpServer, Responder, HttpResponse, middleware::Logger};
use std::env;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use serde_json::json;
use log::{info, error};

// Declaramos los módulos que hemos creado
mod config;
mod database_manager;
mod schema;
mod routes;
mod middleware;
mod lib;
mod excel_generator;
mod models;

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(json!({"ok": true}))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Inicializamos el logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Cargar configuración
    let settings = match config::Settings::new() {
        Ok(s) => s,
        Err(e) => {
            error!("Error cargando la configuración: {}", e);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, "Error de configuración"));
        }
    };

    // --- Configuración del Host y Puerto ---
    let host = settings.host.clone();
    let port = settings.port;

    info!("🚀 Servidor Rust escuchando en http://{}:{}", host, port);

    // Crear y configurar el administrador de base de datos
    let db_manager = Arc::new(database_manager::DatabaseManager::new());
    
    // Inicializar la conexión a la base de datos
    let db_path = Path::new(&settings.db_path);
    if let Err(e) = db_manager.initialize(db_path) {
        error!("Error inicializando la base de datos: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, "Error de base de datos"));
    }
    
    let db_manager_data = web::Data::new(db_manager.clone());
    let settings_data = web::Data::new(settings.clone());

    // Iniciar el servidor HTTP
    HttpServer::new(move || {
        App::new()
            // Agregar el administrador de BD al contexto de la aplicación
            .app_data(db_manager_data.clone())
            // Agregar la configuración al contexto de la aplicación
            .app_data(settings_data.clone())
            
            // Middleware de logging
            .wrap(Logger::default())
            
            // Configurar CORS
            .wrap(actix_cors::Cors::permissive())
            
            // Middleware de autenticación global
            .wrap(middleware::auth::Auth)
            
            // Middleware para forzar HTTPS en producción
            .wrap(middleware::force_https::ForceHttps::new(true))
            
            // Endpoint de health check
            .route("/api/health", web::get().to(health_check))
            
            // Inicializar todas las rutas
            .configure(routes::init)
    })
    .bind((host, port))?
    .run()
    .await
}