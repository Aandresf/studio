// src-backend-rust/src/routes/customers.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{debug, error};
use crate::database_manager::DbPool;
use crate::models::customer_supplier::{Customer, NewCustomer, UpdateCustomer};

// Configuración de rutas para clientes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/customers")
            .route("", web::get().to(get_customers))
            .route("/{id}", web::get().to(get_customer))
            .route("", web::post().to(create_customer))
            .route("/{id}", web::put().to(update_customer))
            .route("/{id}", web::delete().to(delete_customer))
            .route("/search/{name}", web::get().to(search_customers))
    );
}

// Controladores

async fn get_customers(web::Query(params): web::Query<serde_json::Value>, pool: web::Data<DbPool>) -> impl Responder {
    // Extraer parámetros de paginación
    let limit = params["limit"].as_i64();
    let offset = params["offset"].as_i64();
    
    match Customer::find_all(&pool, limit, offset) {
        Ok(customers) => {
            HttpResponse::Ok().json(customers)
        },
        Err(e) => {
            error!("Error al obtener clientes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener clientes",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_customer(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let customer_id = path.into_inner();
    
    match Customer::find_by_id(&pool, customer_id) {
        Ok(customer_opt) => {
            match customer_opt {
                Some(customer) => HttpResponse::Ok().json(customer),
                None => HttpResponse::NotFound().json(json!({
                    "error": "Cliente no encontrado"
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener cliente: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener cliente",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_customer(customer: web::Json<NewCustomer>, pool: web::Data<DbPool>) -> impl Responder {
    match Customer::create(&pool, customer.into_inner()) {
        Ok(created_customer) => {
            HttpResponse::Created().json(created_customer)
        },
        Err(e) => {
            // Verificar si es un error de restricción
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("UNIQUE constraint failed") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un cliente con ese RFC"
                    }));
                }
            }
            
            error!("Error al crear cliente: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear cliente",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_customer(path: web::Path<i64>, customer: web::Json<UpdateCustomer>, pool: web::Data<DbPool>) -> impl Responder {
    let customer_id = path.into_inner();
    
    match Customer::update(&pool, customer_id, customer.into_inner()) {
        Ok(updated_customer) => {
            HttpResponse::Ok().json(updated_customer)
        },
        Err(e) => {
            // Verificar si es un error de cliente no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Cliente no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("UNIQUE constraint failed") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un cliente con ese RFC"
                    }));
                }
            }
            
            error!("Error al actualizar cliente: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar cliente",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_customer(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let customer_id = path.into_inner();
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    match Customer::delete(&pool, customer_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": customer_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de cliente no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Cliente no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (ventas asociadas)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar el cliente porque tiene ventas asociadas") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar el cliente porque tiene ventas asociadas"
                    }));
                }
            }
            
            error!("Error al eliminar cliente: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar cliente",
                "details": e.to_string()
            }))
        }
    }
}

async fn search_customers(path: web::Path<String>, pool: web::Data<DbPool>) -> impl Responder {
    let name = path.into_inner();
    
    match Customer::search_by_name(&pool, &name) {
        Ok(customers) => {
            HttpResponse::Ok().json(customers)
        },
        Err(e) => {
            error!("Error al buscar clientes: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar clientes",
                "details": e.to_string()
            }))
        }
    }
}