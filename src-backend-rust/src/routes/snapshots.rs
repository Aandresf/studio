// src-backend-rust/src/routes/snapshots.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct SnapshotQuery {
    date: Option<String>,
    include_details: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSnapshotRequest {
    name: String,
    description: Option<String>,
    include_prices: Option<bool>,
    include_costs: Option<bool>,
}

// Configuración de rutas para snapshots
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/snapshots")
            .route("", web::get().to(get_all_snapshots))
            .route("", web::post().to(create_snapshot))
            .route("/{id}", web::get().to(get_snapshot))
            .route("/{id}", web::delete().to(delete_snapshot))
            .route("/{id}/compare/{target_id}", web::get().to(compare_snapshots))
            .route("/{id}/restore", web::post().to(restore_snapshot))
    );
}

// Controladores

async fn get_all_snapshots() -> impl Responder {
    // En una implementación real, obtendríamos todos los snapshots de la base de datos
    
    HttpResponse::Ok().json(json!([
        {
            "id": "S001",
            "name": "Snapshot Mensual - Octubre 2023",
            "date": "2023-10-01T00:00:00Z",
            "description": "Snapshot automático mensual",
            "items_count": 1250,
            "total_value": 500000.0,
            "created_by": "admin"
        },
        {
            "id": "S002",
            "name": "Pre-Inventario Anual",
            "date": "2023-09-15T00:00:00Z",
            "description": "Snapshot antes del inventario anual",
            "items_count": 1200,
            "total_value": 480000.0,
            "created_by": "admin"
        },
        {
            "id": "S003",
            "name": "Post-Ajuste de Precios",
            "date": "2023-08-01T00:00:00Z",
            "description": "Snapshot después de ajuste de precios",
            "items_count": 1180,
            "total_value": 460000.0,
            "created_by": "admin"
        }
    ]))
}

async fn create_snapshot(body: web::Json<CreateSnapshotRequest>) -> impl Responder {
    // En una implementación real, crearíamos un nuevo snapshot en la base de datos
    
    let now = Utc::now();
    let snapshot_id = format!("S{}", now.timestamp());
    
    HttpResponse::Created().json(json!({
        "id": snapshot_id,
        "name": body.name,
        "description": body.description,
        "date": now.to_rfc3339(),
        "items_count": 1250,
        "total_value": 500000.0,
        "created_by": "admin",
        "include_prices": body.include_prices.unwrap_or(true),
        "include_costs": body.include_costs.unwrap_or(true)
    }))
}

async fn get_snapshot(path: web::Path<String>, query: web::Query<SnapshotQuery>) -> impl Responder {
    let id = path.into_inner();
    let include_details = query.include_details.unwrap_or(false);
    
    // En una implementación real, obtendríamos el snapshot específico de la base de datos
    
    let mut snapshot = json!({
        "id": id,
        "name": "Snapshot Mensual - Octubre 2023",
        "date": "2023-10-01T00:00:00Z",
        "description": "Snapshot automático mensual",
        "items_count": 1250,
        "total_value": 500000.0,
        "created_by": "admin",
        "include_prices": true,
        "include_costs": true
    });
    
    if include_details {
        snapshot.as_object_mut().unwrap().insert(
            "items".to_string(),
            json!([
                {
                    "id": "P001",
                    "name": "Producto 1",
                    "code": "PRD001",
                    "stock": 50.0,
                    "price": 100.0,
                    "cost": 60.0,
                    "total_value": 5000.0
                },
                {
                    "id": "P002",
                    "name": "Producto 2",
                    "code": "PRD002",
                    "stock": 30.0,
                    "price": 150.0,
                    "cost": 90.0,
                    "total_value": 4500.0
                },
                // Más productos aquí...
            ])
        );
    }
    
    HttpResponse::Ok().json(snapshot)
}

async fn delete_snapshot(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    
    // En una implementación real, eliminaríamos el snapshot de la base de datos
    
    HttpResponse::Ok().json(json!({
        "success": true,
        "message": format!("Snapshot {} eliminado correctamente", id)
    }))
}

async fn compare_snapshots(path: web::Path<(String, String)>) -> impl Responder {
    let (id, target_id) = path.into_inner();
    
    // En una implementación real, compararíamos los dos snapshots
    
    HttpResponse::Ok().json(json!({
        "snapshot1": {
            "id": id,
            "name": "Snapshot Mensual - Octubre 2023",
            "date": "2023-10-01T00:00:00Z"
        },
        "snapshot2": {
            "id": target_id,
            "name": "Snapshot Mensual - Septiembre 2023",
            "date": "2023-09-01T00:00:00Z"
        },
        "summary": {
            "items_added": 50,
            "items_removed": 10,
            "items_changed": 200,
            "total_value_diff": 20000.0,
            "percentage_change": 4.0
        },
        "changes": [
            {
                "id": "P001",
                "name": "Producto 1",
                "type": "changed",
                "changes": {
                    "stock": {
                        "from": 45.0,
                        "to": 50.0,
                        "diff": 5.0
                    },
                    "price": {
                        "from": 95.0,
                        "to": 100.0,
                        "diff": 5.0
                    }
                }
            },
            {
                "id": "P050",
                "name": "Producto Nuevo",
                "type": "added"
            },
            {
                "id": "P099",
                "name": "Producto Eliminado",
                "type": "removed"
            }
        ]
    }))
}

async fn restore_snapshot(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    
    // En una implementación real, restauraríamos el inventario desde el snapshot
    
    HttpResponse::Ok().json(json!({
        "success": true,
        "message": format!("Inventario restaurado correctamente desde snapshot {}", id),
        "items_restored": 1250,
        "details": {
            "prices_restored": true,
            "costs_restored": true,
            "stock_restored": true
        }
    }))
}