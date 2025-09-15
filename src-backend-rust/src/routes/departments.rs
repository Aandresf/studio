// src-backend-rust/src/routes/departments.rs

use actix_web::{web, HttpResponse, Responder, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{debug, error};
use crate::database_manager::DbPool;
use crate::models::department::{Department, NewDepartment, UpdateDepartment};
use crate::models::department::{Subdepartment, NewSubdepartment, UpdateSubdepartment};

// Configuración de rutas para departamentos
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/departments")
            .route("", web::get().to(get_departments))
            .route("/{id}", web::get().to(get_department))
            .route("", web::post().to(create_department))
            .route("/{id}", web::put().to(update_department))
            .route("/{id}", web::delete().to(delete_department))
            .route("/search/{name}", web::get().to(search_departments))
            .route("/{id}/subdepartments", web::get().to(get_subdepartments))
            .route("/{id}/subdepartments", web::post().to(create_subdepartment))
            .service(
                web::scope("/subdepartments")
                    .route("/{id}", web::get().to(get_subdepartment))
                    .route("/{id}", web::put().to(update_subdepartment))
                    .route("/{id}", web::delete().to(delete_subdepartment))
                    .route("/search/{name}", web::get().to(search_subdepartments))
            )
    );
}

// Controladores para departamentos

async fn get_departments(pool: web::Data<DbPool>) -> impl Responder {
    match Department::find_all(&pool) {
        Ok(departments) => {
            HttpResponse::Ok().json(departments)
        },
        Err(e) => {
            error!("Error al obtener departamentos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener departamentos",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_department(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let department_id = path.into_inner();
    
    match Department::find_by_id(&pool, department_id) {
        Ok(department_opt) => {
            match department_opt {
                Some(department) => HttpResponse::Ok().json(department),
                None => HttpResponse::NotFound().json(json!({
                    "error": "Departamento no encontrado"
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener departamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener departamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_department(department: web::Json<NewDepartment>, pool: web::Data<DbPool>) -> impl Responder {
    match Department::create(&pool, department.into_inner()) {
        Ok(created_department) => {
            HttpResponse::Created().json(created_department)
        },
        Err(e) => {
            // Verificar si es un error de restricción (nombre duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un departamento con ese nombre") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un departamento con ese nombre"
                    }));
                } else if msg.contains("Ya existe un departamento con esa abreviatura") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un departamento con esa abreviatura"
                    }));
                }
            }
            
            error!("Error al crear departamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear departamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_department(path: web::Path<i64>, department: web::Json<UpdateDepartment>, pool: web::Data<DbPool>) -> impl Responder {
    let department_id = path.into_inner();
    
    match Department::update(&pool, department_id, department.into_inner()) {
        Ok(updated_department) => {
            HttpResponse::Ok().json(updated_department)
        },
        Err(e) => {
            // Verificar si es un error de departamento no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Departamento no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (nombre duplicado)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un departamento con ese nombre") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un departamento con ese nombre"
                    }));
                } else if msg.contains("Ya existe un departamento con esa abreviatura") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un departamento con esa abreviatura"
                    }));
                }
            }
            
            error!("Error al actualizar departamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar departamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_department(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let department_id = path.into_inner();
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    match Department::delete(&pool, department_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": department_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de departamento no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Departamento no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (subdepartamentos asociados)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar el departamento porque tiene subdepartamentos asociados") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar el departamento porque tiene subdepartamentos asociados"
                    }));
                }
            }
            
            error!("Error al eliminar departamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar departamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn search_departments(path: web::Path<String>, pool: web::Data<DbPool>) -> impl Responder {
    let name = path.into_inner();
    
    match Department::search_by_name(&pool, &name) {
        Ok(departments) => {
            HttpResponse::Ok().json(departments)
        },
        Err(e) => {
            error!("Error al buscar departamentos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar departamentos",
                "details": e.to_string()
            }))
        }
    }
}

// Controladores para subdepartamentos

async fn get_subdepartments(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let department_id = path.into_inner();
    
    match Subdepartment::find_by_department(&pool, department_id) {
        Ok(subdepartments) => {
            HttpResponse::Ok().json(subdepartments)
        },
        Err(e) => {
            error!("Error al obtener subdepartamentos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener subdepartamentos",
                "details": e.to_string()
            }))
        }
    }
}

async fn get_subdepartment(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    match Subdepartment::find_by_id(&pool, subdepartment_id) {
        Ok(subdepartment_opt) => {
            match subdepartment_opt {
                Some(subdepartment) => HttpResponse::Ok().json(subdepartment),
                None => HttpResponse::NotFound().json(json!({
                    "error": "Subdepartamento no encontrado"
                }))
            }
        },
        Err(e) => {
            error!("Error al obtener subdepartamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener subdepartamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn create_subdepartment(path: web::Path<i64>, subdepartment: web::Json<NewSubdepartment>, pool: web::Data<DbPool>) -> impl Responder {
    let department_id = path.into_inner();
    
    // Asegurarse de que el department_id en la ruta coincida con el del cuerpo
    let mut subdepartment_data = subdepartment.into_inner();
    subdepartment_data.department_id = department_id;
    
    match Subdepartment::create(&pool, subdepartment_data) {
        Ok(created_subdepartment) => {
            HttpResponse::Created().json(created_subdepartment)
        },
        Err(e) => {
            // Verificar si es un error de restricción (nombre duplicado o departamento inexistente)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un subdepartamento con ese nombre en este departamento") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un subdepartamento con ese nombre en este departamento"
                    }));
                } else if msg.contains("El departamento especificado no existe") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "El departamento especificado no existe"
                    }));
                }
            }
            
            error!("Error al crear subdepartamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear subdepartamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn update_subdepartment(path: web::Path<i64>, subdepartment: web::Json<UpdateSubdepartment>, pool: web::Data<DbPool>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    match Subdepartment::update(&pool, subdepartment_id, subdepartment.into_inner()) {
        Ok(updated_subdepartment) => {
            HttpResponse::Ok().json(updated_subdepartment)
        },
        Err(e) => {
            // Verificar si es un error de subdepartamento no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Subdepartamento no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (nombre duplicado o departamento inexistente)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("Ya existe un subdepartamento con ese nombre en este departamento") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "Ya existe un subdepartamento con ese nombre en este departamento"
                    }));
                } else if msg.contains("El departamento especificado no existe") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "El departamento especificado no existe"
                    }));
                }
            }
            
            error!("Error al actualizar subdepartamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar subdepartamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn delete_subdepartment(path: web::Path<i64>, pool: web::Data<DbPool>) -> impl Responder {
    let subdepartment_id = path.into_inner();
    
    // En un caso real, necesitaríamos obtener el ID del usuario que realiza la acción
    match Subdepartment::delete(&pool, subdepartment_id, Some("system".to_string())) {
        Ok(_) => {
            HttpResponse::Ok().json(json!({
                "id": subdepartment_id,
                "deleted": true
            }))
        },
        Err(e) => {
            // Verificar si es un error de subdepartamento no encontrado
            if let rusqlite::Error::QueryReturnedNoRows = e {
                return HttpResponse::NotFound().json(json!({
                    "error": "Subdepartamento no encontrado"
                }));
            }
            
            // Verificar si es un error de restricción (productos asociados)
            if let rusqlite::Error::SqliteFailure(_, Some(msg)) = &e {
                if msg.contains("No se puede eliminar el subdepartamento porque tiene productos asociados") {
                    return HttpResponse::BadRequest().json(json!({
                        "error": "No se puede eliminar el subdepartamento porque tiene productos asociados"
                    }));
                }
            }
            
            error!("Error al eliminar subdepartamento: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al eliminar subdepartamento",
                "details": e.to_string()
            }))
        }
    }
}

async fn search_subdepartments(path: web::Path<String>, pool: web::Data<DbPool>) -> impl Responder {
    let name = path.into_inner();
    
    match Subdepartment::search_by_name(&pool, &name) {
        Ok(subdepartments) => {
            HttpResponse::Ok().json(subdepartments)
        },
        Err(e) => {
            error!("Error al buscar subdepartamentos: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al buscar subdepartamentos",
                "details": e.to_string()
            }))
        }
    }
}