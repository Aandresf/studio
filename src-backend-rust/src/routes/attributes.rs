// src-backend-rust/src/routes/attributes.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use log::{debug, error};
use crate::database_manager::DatabaseManager;
use crate::models::attribute::{Attribute, NewAttribute, UpdateAttribute, AttributeValue, NewAttributeValue, UpdateAttributeValue};

// Configuración de rutas para atributos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/attributes")
            .route("", web::get().to(get_attributes))
            .route("/{id}", web::get().to(get_attribute))
            .route("", web::post().to(create_attribute))
            .route("/{id}", web::put().to(update_attribute))
            .route("/{id}", web::delete().to(delete_attribute))
            .route("/search/{name}", web::get().to(search_attributes))
            // Rutas para valores de atributos
            .route("/{id}/values", web::get().to(get_attribute_values))
            .route("/{id}/values", web::post().to(create_attribute_value))
            .route("/{attribute_id}/values/{value_id}", web::put().to(update_attribute_value))
            .route("/{attribute_id}/values/{value_id}", web::delete().to(delete_attribute_value))
    );
}

// Controladores para Atributos

async fn get_attributes(db_manager: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match db_manager.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };

    match Attribute::find_all(&pool) {
        Ok(attributes) => HttpResponse::Ok().json(attributes),
        Err(e) => {
            error!("Error al obtener atributos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener atributos",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_attribute(path: web::Path<i64>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match Attribute::find_by_id(&pool, attribute_id) {
        Ok(attribute_opt) => {
            match attribute_opt {
                Some(attribute) => HttpResponse::Ok().json(attribute),
                None => HttpResponse::NotFound().json(json!({
                    "error": "Atributo no encontrado"
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_attribute(attribute: web::Json<NewAttribute>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match Attribute::create(&pool, attribute.into_inner()) {
        Ok(created_attribute) => {
            HttpResponse::Created().json(created_attribute)
        },
        Err(e) => {
            // Verificar si es un error de restricción (nombre duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un atributo con ese nombre") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un atributo con ese nombre"
                    }));
                }
            }
            
            error!("Error al crear atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_attribute(path: web::Path<i64>, attribute: web::Json<UpdateAttribute>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match Attribute::update(&pool, attribute_id, attribute.into_inner()) {
        Ok(updated_attribute) => {
            HttpResponse::Ok().json(updated_attribute)
        },
        Err(e) => {
            // Verificar si es un error de atributo no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Atributo no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (nombre duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un atributo con ese nombre") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un atributo con ese nombre"
                    }));
                }
            }
            
            error!("Error al actualizar atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_attribute(path: web::Path<i64>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    // Aquí usamos "system" como ejemplo
    match Attribute::delete(&pool, attribute_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": attribute_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de atributo no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Atributo no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (valores de atributos asociados)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar el atributo porque tiene valores de atributos asociados") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar el atributo porque tiene valores de atributos asociados"
                    }));
                }
            }
            
            error!("Error al eliminar atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn search_attributes(path: web::Path<String>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let name = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match Attribute::search_by_name(&pool, &name) {
        Ok(attributes) => {
            HttpResponse::Ok().json(attributes)
        },
        Err(e) => {
            error!("Error al buscar atributos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar atributos",
                "details": e.to_string()
            }))
        }
    }
}

// Controladores para Valores de Atributos

async fn get_attribute_values(path: web::Path<i64>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match AttributeValue::find_by_attribute(&pool, attribute_id) {
        Ok(values) => {
            HttpResponse::Ok().json(values)
        },
        Err(e) => {
            error!("Error al obtener valores de atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener valores de atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_attribute_value(path: web::Path<i64>, value: web::Json<NewAttributeValue>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let attribute_id = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    // Asegurarse de que el attribute_id en la ruta coincida con el del cuerpo
    let mut value_data = value.into_inner();
    value_data.attribute_id = attribute_id;
    
    match AttributeValue::create(&pool, value_data) {
        Ok(created_value) => {
            HttpResponse::Created().json(created_value)
        },
        Err(e) => {
            // Verificar si es un error de restricción (valor duplicado o atributo inexistente)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un valor con ese nombre para este atributo") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un valor con ese nombre para este atributo"
                    }));
                } else if msg.contains("El atributo especificado no existe") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "El atributo especificado no existe"
                    }));
                }
            }
            
            error!("Error al crear valor de atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear valor de atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_attribute_value(path: web::Path<(i64, i64)>, value: web::Json<UpdateAttributeValue>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let (_attribute_id, value_id) = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    match AttributeValue::update(&pool, value_id, value.into_inner()) {
        Ok(updated_value) => {
            HttpResponse::Ok().json(updated_value)
        },
        Err(e) => {
            // Verificar si es un error de valor no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Valor de atributo no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (valor duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un valor con ese nombre para este atributo") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un valor con ese nombre para este atributo"
                    }));
                }
            }
            
            error!("Error al actualizar valor de atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar valor de atributo",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_attribute_value(path: web::Path<(i64, i64)>, pool: web::Data<Arc<DatabaseManager>>) -> impl Responder {
    let (_, value_id) = path.into_inner();
    
    let pool = match pool.get_pool() {
        Ok(pool) => pool,
        Err(e) => {
            error!("Error al obtener pool de conexiones: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a base de datos"
            }));
        }
    };
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    // Aquí usamos "system" como ejemplo
    match AttributeValue::delete(&pool, value_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": value_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de valor no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Valor de atributo no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (variantes de productos asociadas)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar el valor de atributo porque está asociado a variantes de productos") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar el valor de atributo porque está asociado a variantes de productos"
                    }));
                }
            }
            
            error!("Error al eliminar valor de atributo: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar valor de atributo",
                "details": e.to_string()
            }))
        }
    }
}
