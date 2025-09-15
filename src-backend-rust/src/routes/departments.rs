// src-backend-rust/src/routes/departments.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use nanoid::nanoid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Department {
    id: Option<String>,
    name: String,
    description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Subdepartment {
    id: Option<String>,
    name: String,
    description: Option<String>,
    department_id: String,
}

// Configuración de rutas para departamentos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/departments")
            .route("", web::get().to(get_departments))
            .route("/{id}", web::get().to(get_department))
            .route("", web::post().to(create_department))
            .route("/{id}", web::put().to(update_department))
            .route("/{id}", web::delete().to(delete_department))
            .route("/{id}/subdepartments", web::get().to(get_subdepartments))
            .route("/{id}/subdepartments", web::post().to(create_subdepartment))
            .service(
                web::scope("/subdepartments")
                    .route("/{id}", web::get().to(get_subdepartment))
                    .route("/{id}", web::put().to(update_subdepartment))
                    .route("/{id}", web::delete().to(delete_subdepartment))
            )
    );
}

// Controladores para departamentos

async fn get_departments() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Electrónica",
            "description": "Productos electrónicos"
        },
        {
            "id": "2",
            "name": "Ropa",
            "description": "Productos de vestir"
        }
    ]))
}

async fn get_department(path: web::Path<String>) -> impl Responder {
    let department_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": department_id,
        "name": "Electrónica",
        "description": "Productos electrónicos"
    }))
}

async fn create_department(department: web::Json<Department>) -> impl Responder {
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": department.name,
        "description": department.description,
        "created": true
    }))
}

async fn update_department(path: web::Path<String>, department: web::Json<Department>) -> impl Responder {
    let department_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": department_id,
        "name": department.name,
        "description": department.description,
        "updated": true
    }))
}

async fn delete_department(path: web::Path<String>) -> impl Responder {
    let department_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": department_id,
        "deleted": true
    }))
}

// Controladores para subdepartamentos

async fn get_subdepartments(path: web::Path<String>) -> impl Responder {
    let department_id = path.into_inner();
    
    // En una implementación real, consultaríamos los subdepartamentos de un departamento
    HttpResponse::Ok().json(json!([
        {
            "id": "1",
            "name": "Teléfonos",
            "description": "Teléfonos móviles",
            "department_id": department_id
        },
        {
            "id": "2",
            "name": "Computadoras",
            "description": "Laptops y computadoras de escritorio",
            "department_id": department_id
        }
    ]))
}

async fn get_subdepartment(path: web::Path<String>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": subdepartment_id,
        "name": "Teléfonos",
        "description": "Teléfonos móviles",
        "department_id": "1"
    }))
}

async fn create_subdepartment(path: web::Path<String>, subdepartment: web::Json<Subdepartment>) -> impl Responder {
    let department_id = path.into_inner();
    
    // En una implementación real, insertaríamos en la base de datos
    let id = nanoid!(10);
    
    HttpResponse::Created().json(json!({
        "id": id,
        "name": subdepartment.name,
        "description": subdepartment.description,
        "department_id": department_id,
        "created": true
    }))
}

async fn update_subdepartment(path: web::Path<String>, subdepartment: web::Json<Subdepartment>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    // En una implementación real, actualizaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": subdepartment_id,
        "name": subdepartment.name,
        "description": subdepartment.description,
        "department_id": subdepartment.department_id,
        "updated": true
    }))
}

async fn delete_subdepartment(path: web::Path<String>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    // En una implementación real, eliminaríamos en la base de datos
    HttpResponse::Ok().json(json!({
        "id": subdepartment_id,
        "deleted": true
    }))
}