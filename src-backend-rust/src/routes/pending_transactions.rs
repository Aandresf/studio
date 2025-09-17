// src-backend-rust/src/routes/pending_transactions.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use std::fs;
use std::path::Path;
use std::io::ErrorKind;
use std::collections::HashMap;
use crate::lib::authorize::{Authorize, permissions};
use crate::models::role_permission::{Permission};
use crate::config;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PendingTransaction {
    pub id: String,
    #[serde(flatten)]
    pub payload: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PendingTransactionsStore {
    pub sales: Vec<PendingTransaction>,
    pub purchases: Vec<PendingTransaction>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePendingTransactionRequest {
    pub r#type: String,
    pub payload: serde_json::Value,
    pub id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeletePendingTransactionResponse {
    pub id: String,
    pub removed: i32,
}

// Configuración de rutas para transacciones pendientes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/pending-transactions")
            .route("", web::get().to(get_pending_transactions))
            .route("", web::post().to(create_pending_transaction))
            .route("/{id}", web::delete().to(delete_pending_transaction))
    );
}

fn read_store() -> Result<PendingTransactionsStore, std::io::Error> {
    // Obtener la ruta del archivo de transacciones pendientes
    let data_dir = config::get_data_dir()?;
    let file_path = data_dir.join("pending_transactions.json");
    
    // Si el archivo no existe, crear uno nuevo con estructura vacía
    if !file_path.exists() {
        // Asegurar que el directorio existe
        if !data_dir.exists() {
            fs::create_dir_all(&data_dir)?;
        }
        
        // Crear archivo inicial
        let empty_store = PendingTransactionsStore {
            sales: Vec::new(),
            purchases: Vec::new(),
        };
        let json_content = serde_json::to_string_pretty(&empty_store)?;
        fs::write(&file_path, json_content)?;
        return Ok(empty_store);
    }
    
    // Leer el archivo existente
    let raw_content = fs::read_to_string(&file_path)?;
    
    // Parsear el contenido
    match serde_json::from_str::<PendingTransactionsStore>(&raw_content) {
        Ok(store) => Ok(store),
        Err(_) => {
            // Si hay error al parsear, reiniciar con estructura vacía
            let empty_store = PendingTransactionsStore {
                sales: Vec::new(),
                purchases: Vec::new(),
            };
            let json_content = serde_json::to_string_pretty(&empty_store)?;
            fs::write(&file_path, json_content)?;
            Ok(empty_store)
        }
    }
}

fn write_store(store: &PendingTransactionsStore) -> Result<(), std::io::Error> {
    let data_dir = config::get_data_dir()?;
    let file_path = data_dir.join("pending_transactions.json");
    let tmp_path = data_dir.join("pending_transactions.json.tmp");
    
    // Escribir primero a un archivo temporal
    let json_content = serde_json::to_string_pretty(&store)?;
    fs::write(&tmp_path, json_content)?;
    
    // Renombrar para realizar la operación de manera atómica
    fs::rename(&tmp_path, &file_path)?;
    
    Ok(())
}

// Controladores
async fn get_pending_transactions(
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PENDING_READ) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver transacciones pendientes"
        }));
    }
    
    match read_store() {
        Ok(store) => HttpResponse::Ok().json(store),
        Err(e) => {
            error!("Error al leer el almacén de transacciones pendientes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al leer las transacciones pendientes",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_pending_transaction(
    req: web::Json<CreatePendingTransactionRequest>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PENDING_CREATE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para crear transacciones pendientes"
        }));
    }
    
    // Validar los campos requeridos
    if req.r#type.is_empty() || req.payload.is_null() {
        return HttpResponse::BadRequest().json(json!({
            "error": "Se requieren los campos 'type' y 'payload'"
        }));
    }
    
    match read_store() {
        Ok(mut store) => {
            // Generar ID si no se proporciona
            let record_id = match &req.id {
                Some(id) => id.clone(),
                None => format!("pending-{}", chrono::Utc::now().timestamp_millis())
            };
            
            // Crear el nuevo item
            let mut item = req.payload.clone();
            
            // Asegurarse de que payload es un objeto
            if !item.is_object() {
                item = serde_json::Value::Object(serde_json::Map::new());
            }
            
            // Añadir el ID
            if let Some(obj) = item.as_object_mut() {
                obj.insert("id".to_string(), json!(record_id));
            }
            
            let transaction = PendingTransaction {
                id: record_id.clone(),
                payload: item.clone(),
            };
            
            // Agregar a la colección correspondiente
            if req.r#type == "sale" {
                store.sales.insert(0, transaction.clone());
            } else if req.r#type == "purchase" {
                store.purchases.insert(0, transaction.clone());
            } else {
                return HttpResponse::BadRequest().json(json!({
                    "error": "El tipo debe ser 'sale' o 'purchase'"
                }));
            }
            
            // Guardar el almacén actualizado
            match write_store(&store) {
                Ok(_) => HttpResponse::Created().json(transaction),
                Err(e) => {
                    error!("Error al guardar la transacción pendiente: {}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "error": "Error al guardar la transacción pendiente",
                        "details": e.to_string()
                    }))
                }
            }
        },
        Err(e) => {
            error!("Error al leer el almacén de transacciones pendientes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al acceder a las transacciones pendientes",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_pending_transaction(
    path: web::Path<String>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PENDING_DELETE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para eliminar transacciones pendientes"
        }));
    }
    
    let id = path.into_inner();
    
    match read_store() {
        Ok(mut store) => {
            // Contar elementos antes de eliminar
            let before_sales = store.sales.len() as i32;
            let before_purchases = store.purchases.len() as i32;
            
            // Filtrar para eliminar la transacción con el ID especificado
            store.sales.retain(|s| s.id != id);
            store.purchases.retain(|p| p.id != id);
            
            // Contar elementos después de eliminar
            let after_sales = store.sales.len() as i32;
            let after_purchases = store.purchases.len() as i32;
            let removed = (before_sales + before_purchases) - (after_sales + after_purchases);
            
            // Guardar el almacén actualizado
            match write_store(&store) {
                Ok(_) => HttpResponse::Ok().json(DeletePendingTransactionResponse {
                    id,
                    removed,
                }),
                Err(e) => {
                    error!("Error al guardar después de eliminar la transacción pendiente: {}", e);
                    HttpResponse::InternalServerError().json(json!({
                        "error": "Error al eliminar la transacción pendiente",
                        "details": e.to_string()
                    }))
                }
            }
        },
        Err(e) => {
            error!("Error al leer el almacén de transacciones pendientes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al acceder a las transacciones pendientes",
                "details": e.to_string()
            }))
        }
    }
}