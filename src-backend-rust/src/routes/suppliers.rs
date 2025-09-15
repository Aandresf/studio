// src-backend-rust/src/routes/suppliers.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Supplier {
    id: Option<String>,
    name: String,
    tax_id: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    contact_person: Option<String>,
    notes: Option<String>,
}

// Configuración de rutas para proveedores
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/suppliers")
            .route("", web::get().to(get_suppliers))
            .route("/{id}", web::get().to(get_supplier))
            .route("", web::post().to(create_supplier))
            .route("/{id}", web::put().to(update_supplier))
            .route("/{id}", web::delete().to(delete_supplier))
    );
}

// Controladores

async fn get_suppliers() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Proveedor Ejemplo",
            "tax_id": "12345678-9",
            "email": "proveedor@ejemplo.com",
            "phone": "123456789",
            "address": "Calle Proveedor 123",
            "contact_person": "Juan Pérez",
            "notes": null
        },
        {
            "id": "2",
            "name": "Otro Proveedor",
            "tax_id": "98765432-1",
            "email": "otro@proveedor.com",
            "phone": "987654321",
            "address": "Avenida Proveedor 456",
            "contact_person": "María Rodríguez",
            "notes": null
        }
    ]))
}

async fn get_supplier(path: web::Path<String>) -> impl Responder {
    let supplier_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": supplier_id,
        "name": "Proveedor Ejemplo",
        "tax_id": "12345678-9",
        "email": "proveedor@ejemplo.com",
        "phone": "123456789",
        "address": "Calle Proveedor 123",
        "contact_person": "Juan Pérez",
        "notes": null
    }))
}

async fn create_supplier(supplier: web::Json<Supplier>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": supplier.name,
        "tax_id": supplier.tax_id,
        "email": supplier.email,
        "phone": supplier.phone,
        "address": supplier.address,
        "contact_person": supplier.contact_person,
        "notes": supplier.notes,
        "created": true
    }))
}

async fn update_supplier(path: web::Path<String>, supplier: web::Json<Supplier>) -> impl Responder {
    let supplier_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": supplier_id,
        "name": supplier.name,
        "tax_id": supplier.tax_id,
        "email": supplier.email,
        "phone": supplier.phone,
        "address": supplier.address,
        "contact_person": supplier.contact_person,
        "notes": supplier.notes,
        "updated": true
    }))
}

async fn delete_supplier(path: web::Path<String>) -> impl Responder {
    let supplier_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": supplier_id,
        "deleted": true
    }))
}