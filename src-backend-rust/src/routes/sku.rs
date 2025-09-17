// src-backend-rust/src/routes/sku.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use rusqlite::params;
use crate::database_manager::DbPool;
use crate::lib::authorize::{Authorize, permissions};
use crate::models::role_permission::{Permission};

#[derive(Debug, Serialize, Deserialize)]
pub struct SkuQuery {
    dep_id: i64,
    sub_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkuResponse {
    next_sku: String,
    next_number: i64,
}

// Configuración de rutas para generación de SKU
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/sku")
            .route("/next", web::get().to(get_next_sku))
            .route("/preview", web::get().to(preview_sku))
    );
}

// Controlador para obtener el siguiente SKU (incrementando la secuencia)
async fn get_next_sku(
    query: web::Query<SkuQuery>,
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_CREATE) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para generar códigos SKU"
        }));
    }
    
    let pool = db_pool.get_ref();
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    // Iniciar transacción
    match conn.execute("BEGIN TRANSACTION", []) {
        Ok(_) => {},
        Err(e) => {
            error!("Error al iniciar transacción: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error al iniciar transacción"
            }));
        }
    }
    
    // Intentar obtener la secuencia actual
    let mut sequence_result = conn.query_row(
        "SELECT last_number FROM product_sequences WHERE department_id = ? AND subdepartment_id = ?",
        params![query.dep_id, query.sub_id],
        |row| row.get::<_, i64>(0)
    );
    
    let new_number = match sequence_result {
        Ok(last_number) => {
            // Existe una secuencia, incrementarla
            last_number + 1
        },
        Err(_) => {
            // No existe, crear una nueva
            match conn.execute(
                "INSERT INTO product_sequences (department_id, subdepartment_id, last_number) VALUES (?, ?, 0)",
                params![query.dep_id, query.sub_id]
            ) {
                Ok(_) => 1,
                Err(e) => {
                    error!("Error al insertar nueva secuencia: {}", e);
                    // Rollback en caso de error
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al crear secuencia de productos"
                    }));
                }
            }
        }
    };
    
    // Actualizar la secuencia con el nuevo número
    match conn.execute(
        "UPDATE product_sequences SET last_number = ? WHERE department_id = ? AND subdepartment_id = ?",
        params![new_number, query.dep_id, query.sub_id]
    ) {
        Ok(_) => {},
        Err(e) => {
            error!("Error al actualizar secuencia: {}", e);
            // Rollback en caso de error
            let _ = conn.execute("ROLLBACK", []);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error al actualizar secuencia de productos"
            }));
        }
    }
    
    // Obtener abreviaturas de departamento y subdepartamento
    let dep_abbr = match conn.query_row(
        "SELECT abbreviation FROM departments WHERE id = ?",
        params![query.dep_id],
        |row| row.get::<_, String>(0)
    ) {
        Ok(abbr) => abbr,
        Err(e) => {
            error!("Error al obtener abreviatura de departamento: {}", e);
            // Rollback en caso de error
            let _ = conn.execute("ROLLBACK", []);
            return HttpResponse::NotFound().json(json!({
                "error": "Departamento no encontrado"
            }));
        }
    };
    
    let sub_abbr = match conn.query_row(
        "SELECT abbreviation FROM subdepartments WHERE id = ?",
        params![query.sub_id],
        |row| row.get::<_, String>(0)
    ) {
        Ok(abbr) => abbr,
        Err(e) => {
            error!("Error al obtener abreviatura de subdepartamento: {}", e);
            // Rollback en caso de error
            let _ = conn.execute("ROLLBACK", []);
            return HttpResponse::NotFound().json(json!({
                "error": "Subdepartamento no encontrado"
            }));
        }
    };
    
    // Formatear el SKU
    let formatted_number = format!("{:03}", new_number);
    let base_sku = format!("{}-{}-{}", dep_abbr, sub_abbr, formatted_number);
    
    // Confirmar la transacción
    match conn.execute("COMMIT", []) {
        Ok(_) => {},
        Err(e) => {
            error!("Error al confirmar transacción: {}", e);
            // Rollback en caso de error
            let _ = conn.execute("ROLLBACK", []);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error al confirmar transacción"
            }));
        }
    }
    
    HttpResponse::Ok().json(SkuResponse {
        next_sku: base_sku,
        next_number: new_number,
    })
}

// Controlador para previsualizar el siguiente SKU (sin incrementar la secuencia)
async fn preview_sku(
    query: web::Query<SkuQuery>,
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&permissions::PRODUCTS_READ) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para previsualizar códigos SKU"
        }));
    }
    
    let pool = db_pool.get_ref();
    let conn = match pool.get() {
        Ok(conn) => conn,
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }));
        }
    };
    
    // Obtener la secuencia actual
    let sequence_result = conn.query_row(
        "SELECT last_number FROM product_sequences WHERE department_id = ? AND subdepartment_id = ?",
        params![query.dep_id, query.sub_id],
        |row| row.get::<_, i64>(0)
    );
    
    let last_number = match sequence_result {
        Ok(num) => num,
        Err(_) => 0, // Si no existe, asumimos que es 0
    };
    
    let next_number = last_number + 1;
    
    // Obtener abreviaturas de departamento y subdepartamento
    let dep_abbr = match conn.query_row(
        "SELECT abbreviation FROM departments WHERE id = ?",
        params![query.dep_id],
        |row| row.get::<_, String>(0)
    ) {
        Ok(abbr) => abbr,
        Err(_) => {
            return HttpResponse::NotFound().json(json!({
                "error": "Departamento no encontrado"
            }));
        }
    };
    
    let sub_abbr = match conn.query_row(
        "SELECT abbreviation FROM subdepartments WHERE id = ?",
        params![query.sub_id],
        |row| row.get::<_, String>(0)
    ) {
        Ok(abbr) => abbr,
        Err(_) => {
            return HttpResponse::NotFound().json(json!({
                "error": "Subdepartamento no encontrado"
            }));
        }
    };
    
    // Formatear el SKU
    let formatted_number = format!("{:03}", next_number);
    let base_sku = format!("{}-{}-{}", dep_abbr, sub_abbr, formatted_number);
    
    HttpResponse::Ok().json(SkuResponse {
        next_sku: base_sku,
        next_number,
    })
}
