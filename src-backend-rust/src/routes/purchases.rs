// src-backend-rust/src/routes/purchases.rs

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
pub struct PurchaseItem {
    product_variant_id: i64,
    quantity: f64,
    price: f64,
    discount: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Purchase {
    reference_number: Option<String>,
    supplier_id: Option<i64>,
    invoice_number: Option<String>,
    items: Vec<PurchaseItem>,
    total: f64,
    payment_method: String,
    notes: Option<String>,
    user_id: i64,
}

#[derive(Debug, Deserialize)]
pub struct PurchasesQueryParams {
    limit: Option<i64>,
    offset: Option<i64>,
    supplier_id: Option<i64>,
    status: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
}

// Configuración de rutas para compras
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/purchases")
            .route("", web::get().to(get_purchases))
            .route("/{id}", web::get().to(get_purchase))
            .route("", web::post().to(create_purchase))
            .route("/{id}/annul", web::post().to(annul_purchase))
    );
}

// Controladores
async fn get_purchases(
    db_pool: web::Data<DbPool>,
    query: web::Query<PurchasesQueryParams>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::PurchasesView) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver compras"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    // Obtener parámetros de consulta
    let limit = query.limit;
    let offset = query.offset;
    let supplier_id = query.supplier_id;
    let status = query.status.clone();
    let start_date = query.start_date.clone();
    let end_date = query.end_date.clone();
    
    // Filtrar solo transacciones de tipo compra
    let transaction_type = Some("purchase".to_string());
    
    // Consultar compras con filtros
    match Transaction::find_all(pool, transaction_type, status, supplier_id, start_date, end_date, limit, offset) {
        Ok(purchases) => {
            // Obtener el total para la paginación
            let total = match Transaction::count_all(pool, Some("purchase".to_string()), query.status.clone(), supplier_id, query.start_date.clone(), query.end_date.clone()) {
                Ok(count) => count,
                Err(e) => {
                    error!("Error al contar compras: {}", e);
                    return HttpResponse::InternalServerError().json(json!({
                        "error": "Error al contar compras"
                    }));
                }
            };
            
            HttpResponse::Ok().json(json!({
                "data": purchases,
                "total": total
            }))
        },
        Err(e) => {
            error!("Error al obtener compras: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener compras"
            }))
        }
    }
}

async fn get_purchase(
    db_pool: web::Data<DbPool>,
    id: web::Path<i64>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::PurchasesView) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para ver compras"
        }));
    }
    
    let pool = db_pool.get_ref();
    let purchase_id = id.into_inner();
    
    match Transaction::find_with_details(pool, purchase_id) {
        Ok(Some(purchase)) => {
            // Verificar que sea una compra y no otro tipo de transacción
            if purchase.transaction.transaction_type != "purchase" {
                return HttpResponse::NotFound().json(json!({
                    "error": "Compra no encontrada"
                }));
            }
            
            HttpResponse::Ok().json(purchase)
        },
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Compra no encontrada"
        })),
        Err(e) => {
            error!("Error al obtener compra: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al obtener compra"
            }))
        }
    }
}

async fn create_purchase(
    db_pool: web::Data<DbPool>,
    purchase: web::Json<Purchase>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::PurchasesCreate) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para crear compras"
        }));
    }
    
    let pool = db_pool.get_ref();
    
    // Generar número de referencia si no se proporciona
    let reference_number = match &purchase.reference_number {
        Some(ref_num) => ref_num.clone(),
        None => format!("C{}", nanoid!(6)),
    };
    
    // Convertir a la estructura de transacción
    let new_transaction = NewTransaction {
        reference_number,
        transaction_type: "purchase".to_string(),
        customer_supplier_id: purchase.supplier_id, // En compras, el supplier_id va en customer_supplier_id
        invoice_number: purchase.invoice_number.clone(),
        total: purchase.total,
        payment_method: purchase.payment_method.clone(),
        notes: purchase.notes.clone(),
        user_id: purchase.user_id,
    };
    
    // Convertir items de compra a items de transacción
    let mut transaction_items: Vec<NewTransactionItem> = Vec::new();
    
    for item in &purchase.items {
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
        Ok(created_purchase) => {
            debug!("Compra creada con éxito: {:?}", created_purchase.transaction.id);
            HttpResponse::Created().json(created_purchase)
        },
        Err(e) => {
            error!("Error al crear compra: {}", e);
            
            // Manejar diferentes tipos de errores
            if let rusqlite::Error::SqliteFailure(sqlite_error, Some(error_msg)) = &e {
                if sqlite_error.code == rusqlite::ffi::ErrorCode::ConstraintViolation {
                    return HttpResponse::BadRequest().json(json!({
                        "error": error_msg
                    }));
                }
            }
            
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al crear compra"
            }))
        }
    }
}

async fn annul_purchase(
    db_pool: web::Data<DbPool>,
    id: web::Path<i64>,
    authorize: Authorize,
) -> impl Responder {
    // Verificar permisos
    if !authorize.has_permission(&Permission::PurchasesAnnul) {
        return HttpResponse::Forbidden().json(json!({
            "error": "No tiene permisos para anular compras"
        }));
    }
    
    let pool = db_pool.get_ref();
    let purchase_id = id.into_inner();
    
    // Primero verificar que la transacción sea de tipo compra
    match Transaction::find_by_id(pool, purchase_id) {
        Ok(Some(transaction)) => {
            if transaction.transaction_type != "purchase" {
                return HttpResponse::BadRequest().json(json!({
                    "error": "La transacción especificada no es una compra"
                }));
            }
            
            // Anular la compra
            match Transaction::annul(pool, purchase_id, authorize.user_id) {
                Ok(annulled_purchase) => {
                    debug!("Compra anulada con éxito: {:?}", purchase_id);
                    HttpResponse::Ok().json(json!({
                        "success": true,
                        "transaction": annulled_purchase
                    }))
                },
                Err(e) => {
                    error!("Error al anular compra: {}", e);
                    
                    // Manejar diferentes tipos de errores
                    if let rusqlite::Error::SqliteFailure(_, Some(error_msg)) = &e {
                        return HttpResponse::BadRequest().json(json!({
                            "error": error_msg
                        }));
                    }
                    
                    HttpResponse::InternalServerError().json(json!({
                        "error": "Error al anular compra"
                    }))
                }
            }
        },
        Ok(None) => HttpResponse::NotFound().json(json!({
            "error": "Compra no encontrada"
        })),
        Err(e) => {
            error!("Error al verificar compra: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Error al verificar compra"
            }))
        }
    }
}