// src-backend-rust/src/routes/customers.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Customer {
    id: Option<String>,
    name: String,
    tax_id: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    notes: Option<String>,
}

// Configuración de rutas para clientes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/customers")
            .route("", web::get().to(get_customers))
            .route("/{id}", web::get().to(get_customer))
            .route("", web::post().to(create_customer))
            .route("/{id}", web::put().to(update_customer))
            .route("/{id}", web::delete().to(delete_customer))
    );
}

// Controladores

async fn get_customers() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Cliente Ejemplo",
            "tax_id": "12345678-9",
            "email": "cliente@ejemplo.com",
            "phone": "123456789",
            "address": "Calle Ejemplo 123",
            "notes": null
        },
        {
            "id": "2",
            "name": "Otro Cliente",
            "tax_id": "98765432-1",
            "email": "otro@cliente.com",
            "phone": "987654321",
            "address": "Avenida Cliente 456",
            "notes": null
        }
    ]))
}

async fn get_customer(path: web::Path<String>) -> impl Responder {
    let customer_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": customer_id,
        "name": "Cliente Ejemplo",
        "tax_id": "12345678-9",
        "email": "cliente@ejemplo.com",
        "phone": "123456789",
        "address": "Calle Ejemplo 123",
        "notes": null
    }))
}

async fn create_customer(customer: web::Json<Customer>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": customer.name,
        "tax_id": customer.tax_id,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address,
        "notes": customer.notes,
        "created": true
    }))
}

async fn update_customer(path: web::Path<String>, customer: web::Json<Customer>) -> impl Responder {
    let customer_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": customer_id,
        "name": customer.name,
        "tax_id": customer.tax_id,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address,
        "notes": customer.notes,
        "updated": true
    }))
}

async fn delete_customer(path: web::Path<String>) -> impl Responder {
    let customer_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": customer_id,
        "deleted": true
    }))
}