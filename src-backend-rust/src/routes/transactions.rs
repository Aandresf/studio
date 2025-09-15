// src-backend-rust/src/routes/transactions.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, debug};
use rusqlite::params;
use crate::database_manager::DbPool;
use crate::lib::authorize::{Authorize, Permission};

// Configuración de rutas para transacciones
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/transactions")
            .route("/sales/{transaction_id}", web::delete().to(annul_sale))
            .route("/purchases/{transaction_id}", web::delete().to(annul_purchase))
    );
}

// Controlador para anular ventas
async fn annul_sale(
    path: web::Path<String>,
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::SalesDelete) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para anular ventas"
        }));
    }
    
    let transaction_id = path.into_inner();
    let pool = db_pool.get_ref();
    
    match pool.get() {
        Ok(conn) => {
            // Iniciar transacción
            if let Err(e) = conn.execute("BEGIN TRANSACTION", []) {
                error!("Error al iniciar transacción: {}", e);
                return HttpResponse::InternalServerError().json(json!({
                    "error": "Error al iniciar la transacción"
                }));
            }
            
            // Obtener los movimientos de inventario para esta venta
            let mut stmt = match conn.prepare(
                "SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo' AND type = 'SALIDA'"
            ) {
                Ok(stmt) => stmt,
                Err(e) => {
                    error!("Error al preparar consulta: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al consultar movimientos de inventario"
                    }));
                }
            };
            
            let movements = match stmt.query_map(params![transaction_id], |row| {
                Ok((
                    row.get::<_, i64>("id")?,
                    row.get::<_, i64>("variant_id")?,
                    row.get::<_, i64>("quantity")?,
                ))
            }) {
                Ok(rows) => {
                    let mut movements = Vec::new();
                    for row in rows {
                        match row {
                            Ok((id, variant_id, quantity)) => movements.push((id, variant_id, quantity)),
                            Err(e) => {
                                error!("Error al leer movimiento: {}", e);
                                let _ = conn.execute("ROLLBACK", []);
                                return HttpResponse::InternalServerError().json(json!({
                                    "error": "Error al leer movimientos de inventario"
                                }));
                            }
                        }
                    }
                    movements
                },
                Err(e) => {
                    error!("Error al ejecutar consulta: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al consultar movimientos de inventario"
                    }));
                }
            };
            
            // Verificar que existan movimientos para anular
            if movements.is_empty() {
                let _ = conn.execute("ROLLBACK", []);
                return HttpResponse::NotFound().json(json!({
                    "error": "No se encontraron movimientos de venta activos para anular"
                }));
            }
            
            // Actualizar el stock de cada variante
            for (_, variant_id, quantity) in &movements {
                if let Err(e) = conn.execute(
                    "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
                    params![quantity, variant_id]
                ) {
                    error!("Error al actualizar stock: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al actualizar stock de productos"
                    }));
                }
            }
            
            // Marcar los movimientos como anulados
            if let Err(e) = conn.execute(
                "UPDATE inventory_movements SET status = 'Anulado' WHERE transaction_id = ? AND status = 'Activo'",
                params![transaction_id]
            ) {
                error!("Error al anular movimientos: {}", e);
                let _ = conn.execute("ROLLBACK", []);
                return HttpResponse::InternalServerError().json(json!({
                    "error": "Error al anular movimientos de inventario"
                }));
            }
            
            // Confirmar la transacción
            if let Err(e) = conn.execute("COMMIT", []) {
                error!("Error al confirmar transacción: {}", e);
                let _ = conn.execute("ROLLBACK", []);
                return HttpResponse::InternalServerError().json(json!({
                    "error": "Error al confirmar la transacción"
                }));
            }
            
            HttpResponse::Ok().json(json!({
                "message": "Venta anulada correctamente"
            }))
        },
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }))
        }
    }
}

// Controlador para anular compras
async fn annul_purchase(
    path: web::Path<String>,
    db_pool: web::Data<DbPool>,
    authorize: Authorize
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::PurchasesDelete) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para anular compras"
        }));
    }
    
    let transaction_id = path.into_inner();
    let pool = db_pool.get_ref();
    
    match pool.get() {
        Ok(conn) => {
            // Iniciar transacción
            if let Err(e) = conn.execute("BEGIN TRANSACTION", []) {
                error!("Error al iniciar transacción: {}", e);
                return HttpResponse::InternalServerError().json(json!({
                    "error": "Error al iniciar la transacción"
                }));
            }
            
            // Obtener los movimientos de inventario para esta compra
            let mut stmt = match conn.prepare(
                "SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo' AND type = 'ENTRADA'"
            ) {
                Ok(stmt) => stmt,
                Err(e) => {
                    error!("Error al preparar consulta: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al consultar movimientos de inventario"
                    }));
                }
            };
            
            let movements = match stmt.query_map(params![transaction_id], |row| {
                Ok((
                    row.get::<_, i64>("id")?,
                    row.get::<_, i64>("variant_id")?,
                    row.get::<_, i64>("quantity")?,
                    row.get::<_, f64>("unit_cost")?,
                ))
            }) {
                Ok(rows) => {
                    let mut movements = Vec::new();
                    for row in rows {
                        match row {
                            Ok((id, variant_id, quantity, unit_cost)) => movements.push((id, variant_id, quantity, unit_cost)),
                            Err(e) => {
                                error!("Error al leer movimiento: {}", e);
                                let _ = conn.execute("ROLLBACK", []);
                                return HttpResponse::InternalServerError().json(json!({
                                    "error": "Error al leer movimientos de inventario"
                                }));
                            }
                        }
                    }
                    movements
                },
                Err(e) => {
                    error!("Error al ejecutar consulta: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al consultar movimientos de inventario"
                    }));
                }
            };
            
            // Verificar que existan movimientos para anular
            if movements.is_empty() {
                let _ = conn.execute("ROLLBACK", []);
                return HttpResponse::NotFound().json(json!({
                    "error": "No se encontraron movimientos de compra activos para anular"
                }));
            }
            
            // Procesar cada movimiento
            for (movement_id, variant_id, quantity, unit_cost) in &movements {
                // Obtener información actual de la variante
                let mut stmt = match conn.prepare(
                    "SELECT stock, cost_price FROM product_variants WHERE id = ?"
                ) {
                    Ok(stmt) => stmt,
                    Err(e) => {
                        error!("Error al preparar consulta: {}", e);
                        let _ = conn.execute("ROLLBACK", []);
                        return HttpResponse::InternalServerError().json(json!({
                            "error": "Error al consultar información de productos"
                        }));
                    }
                };
                
                let (current_stock, current_cost) = match stmt.query_row(params![variant_id], |row| {
                    Ok((row.get::<_, i64>("stock")?, row.get::<_, f64>("cost_price")?))
                }) {
                    Ok(data) => data,
                    Err(e) => {
                        error!("Error al obtener datos de variante: {}", e);
                        let _ = conn.execute("ROLLBACK", []);
                        return HttpResponse::InternalServerError().json(json!({
                            "error": "Error al obtener información de producto"
                        }));
                    }
                };
                
                // Calcular nuevo stock y costo
                let stock_before = current_stock - quantity;
                let mut cost_before = 0.0;
                
                if stock_before > 0 {
                    let total_value_current = current_stock as f64 * current_cost;
                    let entry_value = *quantity as f64 * unit_cost;
                    cost_before = (total_value_current - entry_value) / stock_before as f64;
                }
                
                // Actualizar variante
                if let Err(e) = conn.execute(
                    "UPDATE product_variants SET stock = ?, cost_price = ? WHERE id = ?",
                    params![stock_before, cost_before, variant_id]
                ) {
                    error!("Error al actualizar variante: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al actualizar stock de productos"
                    }));
                }
                
                // Marcar el movimiento como anulado
                if let Err(e) = conn.execute(
                    "UPDATE inventory_movements SET status = 'Anulado' WHERE id = ?",
                    params![movement_id]
                ) {
                    error!("Error al anular movimiento: {}", e);
                    let _ = conn.execute("ROLLBACK", []);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al anular movimiento de inventario"
                    }));
                }
            }
            
            // Confirmar la transacción
            if let Err(e) = conn.execute("COMMIT", []) {
                error!("Error al confirmar transacción: {}", e);
                let _ = conn.execute("ROLLBACK", []);
                return HttpResponse::InternalServerError().json(json!({
                    "error": "Error al confirmar la transacción"
                }));
            }
            
            HttpResponse::Ok().json(json!({
                "message": "Compra anulada correctamente"
            }))
        },
        Err(e) => {
            error!("Error al obtener conexión del pool: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error de conexión a la base de datos"
            }))
        }
    }
}