// src-backend-rust/src/routes/sales.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use crate::database_manager::DbPool;
use crate::models::transaction::{Transaction, NewTransaction, NewTransactionItem};
use crate::lib::authorize::{Authorize, Permission};
use nanoid::nanoid;
use serde_json::json;
use chrono::Utc;
use log::{error, debug};

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleItem {
    product_variant_id: i64,
    quantity: f64,
    price: f64,
    discount: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sale {
    reference_number: Option<String>,
    customer_id: Option<i64>,
    items: Vec<SaleItem>,
    total: f64,
    payment_method: String,
    notes: Option<String>,
    user_id: i64,
}

#[derive(Debug, Deserialize)]
pub struct SalesQueryParams {
    limit: Option<i64>,
    offset: Option<i64>,
    customer_id: Option<i64>,
    status: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
}

// Configuración de rutas para ventas
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/sales")
            .route("", web::get().to(get_sales))
            .route("/{id}", web::get().to(get_sale))
            .route("", web::post().to(create_sale))
            .route("/{id}/annul", web::post().to(annul_sale))
    );
}

// Controladores
async fn get_sales(
    db_pool: web::Data<DbPool>,
    query: web::Query<SalesQueryParams>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::SalesView) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver ventas"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    // Obtener parámetros de consulta
    let limit = query.limit;
    let offset = query.offset;
    let customer_id = query.customer_id;
    let status = query.status.clone();
    let start_date = query.start_date.clone();
    let end_date = query.end_date.clone();
    
    // Filtrar solo transacciones de tipo venta
    let transaction_type = Some("sale".to_string());
    
    // Consultar ventas con filtros
    match Transaction::find_all(pool, transaction_type, status, customer_id, start_date, end_date, limit, offset) {
        Ok(sales) => {
            // Obtener el total para la paginación
            let total = match Transaction::count_all(pool, Some("sale".to_string()), query.status.clone(), customer_id, query.start_date.clone(), query.end_date.clone()) {
                Ok(count) => count,
                Err(e) => {
                    error!("Error al contar ventas: {}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al contar ventas"
                    }));
                }
            };
            
            HttpResponse::Ok().json(json!({
                "data": sales,
                "total": total
            }))
        },
        Err(e) => {
            error!("Error al obtener ventas: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener ventas"
            }))
        }
    }
}

async fn get_sale(
    db_pool: web::Data<DbPool>,
    id: web::Path<i64>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::SalesView) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver ventas"
        }));
    }
    
    let pool = db_pool.get_ref();
    let sale_id = id.into_inner();
    
    match Transaction::find_with_details(pool, sale_id) {
        Ok(Some(sale)) => {
            // Verificar que sea una venta y no otro tipo de transacción
            if sale.transaction.transaction_type != "sale" {
                return HttpResponse::NotFound().json(json!({
                    "error": "Venta no encontrada"
                }));
            }
            
            HttpResponse::Ok().json(sale)
        },
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Venta no encontrada"
        })),
        Err(e) => {
            error!("Error al obtener venta: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener venta"
            }))
        }
    }
}

async fn create_sale(
    db_pool: web::Data<DbPool>,
    sale: web::Json<Sale>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::SalesCreate) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para crear ventas"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    // Generar número de referencia si no se proporciona
    let reference_number = match &sale.reference_number {
        Some(ref_num) => ref_num.clone(),
        None => format!("V{}", nanoid!(6)),
    };
    
    // Convertir a la estructura de transacción
    let new_transaction = NewTransaction {
        reference_number,
        transaction_type: "sale".to_string(),
        customer_supplier_id: sale.customer_id,
        invoice_number: None, // Las ventas normalmente no tienen número de factura
        total: sale.total,
        payment_method: sale.payment_method.clone(),
        notes: sale.notes.clone(),
        user_id: sale.user_id,
    };
    
    // Convertir items de venta a items de transacción
    let mut transaction_items: Vec<NewTransactionItem> = Vec::new();
    
    for item in &sale.items {
        let subtotal = item.quantity * item.price - item.discount.unwrap_or(0.0);
        
        transaction_items.push(NewTransactionItem {
            transaction_id: 0, // Se asignará después de crear la transacción
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal,
        });
    }
    
    // Crear la transacción y sus items
    match Transaction::create_with_items(pool, new_transaction, transaction_items) {
        Ok(created_sale) => {
            debug!("Venta creada con éxito: {:?}", created_sale.transaction.id);
            HttpResponse::Created().json(created_sale)
        },
        Err(e) => {
            error!("Error al crear venta: {}", e);
            
            // Manejar diferentes tipos de errores
            if let rusqlite::Error::SqliteFailure(sqlite_error, Some(error_msg)) = &e {
                if sqlite_error.code == rusqlite::ffi::ErrorCode::ConstraintViolation {
                    return HttpResponse::BadRequest().json(json!({
                        "error": error_msg
                    }));
                }
            }
            
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear venta"
            }))
        }
    }
}

async fn annul_sale(
    db_pool: web::Data<DbPool>,
    id: web::Path<i64>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::SalesAnnul) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para anular ventas"
        }));
    }
    
    let pool = db_pool.get_ref();
    let sale_id = id.into_inner();
    
    // Primero verificar que la transacción sea de tipo venta
    match Transaction::find_by_id(pool, sale_id) {
        Ok(Some(transaction)) => {
            if transaction.transaction_type != "sale" {
                return HttpResponse::BadRequest().json(json!({
                    "error": "La transacción especificada no es una venta"
                }));
            }
            
            // Anular la venta
            match Transaction::annul(pool, sale_id, authorize.user_id) {
                Ok(annulled_sale) => {
                    debug!("Venta anulada con éxito: {:?}", sale_id);
                    HttpResponse::Ok().json(json!({
                        "success": true,
                        "transaction": annulled_sale
                    }))
                },
                Err(e) => {
                    error!("Error al anular venta: {}", e);
                    
                    // Manejar diferentes tipos de errores
                    if let rusqlite::Error::SqliteFailure(_, Some(error_msg)) = &e {
                        return HttpResponse::BadRequest().json(json!({
                            "error": error_msg
                        }));
                    }
                    
                    HttpResponse::InternalServerError().json(json!({
                        "error": "Error al anular venta"
                    }))
                }
            }
        },
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Venta no encontrada"
        })),
        Err(e) => {
            error!("Error al verificar venta: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al verificar venta"
            }))
        }
    }
}