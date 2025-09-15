// src-backend-rust/src/routes/role_permissions.rs

use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct Role {
    id: String,
    name: String,
    description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RolePermissions {
    role_id: String,
    permissions: Vec<String>,
}

// Configuración de rutas para permisos de roles
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/role-permissions")
            .route("/roles", web::get().to(get_roles))
            .route("/roles/{id}", web::get().to(get_role))
            .route("/roles/{id}/permissions", web::get().to(get_role_permissions))
            .route("/roles/{id}/permissions", web::put().to(update_role_permissions))
            .route("/permissions", web::get().to(get_all_permissions))
    );
}

// Controladores

async fn get_roles() -> impl Responder {
    // En una implementación real, consultaríamos la base de datos
    HttpResponse::Ok().json(json!([
        {
            "id": "admin",
            "name": "Administrador",
            "description": "Acceso completo a todas las funcionalidades"
        },
        {
            "id": "sales",
            "name": "Ventas",
            "description": "Acceso a ventas e inventario básico"
        },
        {
            "id": "stock",
            "name": "Bodega",
            "description": "Acceso a inventario y compras"
        }
    ]))
}

async fn get_role(path: web::Path<String>) -> impl Responder {
    let role_id = path.into_inner();
    
    // En una implementación real, consultaríamos la base de datos por ID
    HttpResponse::Ok().json(json!({
        "id": role_id,
        "name": role_id == "admin" ? "Administrador" : (role_id == "sales" ? "Ventas" : "Bodega"),
        "description": role_id == "admin" ? "Acceso completo a todas las funcionalidades" : 
                      (role_id == "sales" ? "Acceso a ventas e inventario básico" : "Acceso a inventario y compras")
    }))
}

async fn get_role_permissions(path: web::Path<String>) -> impl Responder {
    let role_id = path.into_inner();
    
    // En una implementación real, consultaríamos los permisos del rol en la base de datos
    // Aquí simulamos diferentes permisos según el rol
    let permissions = match role_id.as_str() {
        "admin" => vec![
            "manage_products", "manage_inventory", "manage_sales", "manage_purchases", 
            "manage_users", "manage_roles", "view_reports", "manage_settings"
        ],
        "sales" => vec![
            "view_products", "view_inventory", "manage_sales"
        ],
        "stock" => vec![
            "view_products", "manage_inventory", "view_purchases", "manage_purchases"
        ],
        _ => vec![]
    };
    
    HttpResponse::Ok().json(json!({
        "role_id": role_id,
        "permissions": permissions
    }))
}

async fn update_role_permissions(path: web::Path<String>, permissions: web::Json<RolePermissions>) -> impl Responder {
    let role_id = path.into_inner();
    
    // En una implementación real, actualizaríamos los permisos en la base de datos
    HttpResponse::Ok().json(json!({
        "role_id": role_id,
        "permissions": permissions.permissions,
        "updated": true
    }))
}

async fn get_all_permissions() -> impl Responder {
    // En una implementación real, obtendríamos esto de un archivo de configuración o base de datos
    // Lista completa de permisos disponibles en el sistema
    HttpResponse::Ok().json(json!([
        {
            "id": "manage_products",
            "name": "Gestionar Productos",
            "description": "Crear, editar y eliminar productos"
        },
        {
            "id": "view_products",
            "name": "Ver Productos",
            "description": "Ver lista de productos y detalles"
        },
        {
            "id": "manage_inventory",
            "name": "Gestionar Inventario",
            "description": "Ajustar stock y ver movimientos"
        },
        {
            "id": "view_inventory",
            "name": "Ver Inventario",
            "description": "Ver niveles de stock actual"
        },
        {
            "id": "manage_sales",
            "name": "Gestionar Ventas",
            "description": "Crear y anular ventas"
        },
        {
            "id": "manage_purchases",
            "name": "Gestionar Compras",
            "description": "Crear y anular compras"
        },
        {
            "id": "view_purchases",
            "name": "Ver Compras",
            "description": "Ver historial de compras"
        },
        {
            "id": "manage_users",
            "name": "Gestionar Usuarios",
            "description": "Crear, editar y eliminar usuarios"
        },
        {
            "id": "manage_roles",
            "name": "Gestionar Roles",
            "description": "Administrar roles y permisos"
        },
        {
            "id": "view_reports",
            "name": "Ver Reportes",
            "description": "Acceder a reportes de ventas e inventario"
        },
        {
            "id": "manage_settings",
            "name": "Gestionar Configuración",
            "description": "Modificar configuración del sistema"
        }
    ]))
}