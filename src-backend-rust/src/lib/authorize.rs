// src-backend-rust/src/lib/authorize.rs

use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, FromRequest,
};
use futures::future::{ready, LocalBoxFuture, Ready};
use std::rc::Rc;
use crate::models::role_permission::Permission;
use crate::models::User;
use std::future::Future;
use std::pin::Pin;

// Permission constants to use throughout the application
pub mod permissions {
    pub const ALL: &str = "*";
    
    // Sales
    pub const SALES_VIEW: &str = "sales:read";
    pub const SALES_CREATE: &str = "sales:create";
    pub const SALES_READ: &str = "sales:read";
    pub const SALES_EDIT: &str = "sales:edit";
    pub const SALES_ANNUL: &str = "sales:annul";
    pub const SALES_DELETE: &str = "sales:delete";
    pub const SALES_EDIT_PRICE: &str = "sales:edit_price";
    pub const SALES_EDIT_INVOICE: &str = "sales:edit_invoice";
    
    // Purchases
    pub const PURCHASES_VIEW: &str = "purchases:read";
    pub const PURCHASES_READ: &str = "purchases:read";
    pub const PURCHASES_CREATE: &str = "purchases:create";
    pub const PURCHASES_EDIT: &str = "purchases:edit";
    pub const PURCHASES_ANNUL: &str = "purchases:annul";
    pub const PURCHASES_DELETE: &str = "purchases:delete";
    
    // Products
    pub const PRODUCTS_VIEW: &str = "products:read";
    pub const PRODUCTS_READ: &str = "products:read";
    pub const PRODUCTS_CREATE: &str = "products:create";
    pub const PRODUCTS_EDIT: &str = "products:edit";
    pub const PRODUCTS_DELETE: &str = "products:delete";
    pub const PRODUCTS_READ_PRICES_SALE: &str = "products:read_prices_sale";
    pub const PRODUCTS_READ_COSTS: &str = "products:read_costs";
    pub const PRODUCTS_MANUAL_SKU: &str = "products:manual_sku";
    
    // Inventory
    pub const INVENTORY_VIEW: &str = "inventory:view";
    pub const INVENTORY_MANAGE: &str = "inventory:write";
    
    // Reports
    pub const REPORTS_READ: &str = "reports:read";
    pub const REPORTS_GENERATE: &str = "reports:create_snapshot";
    
    // Dashboard
    pub const DASHBOARD_READ: &str = "dashboard:read";
    
    // Settings
    pub const SETTINGS_VIEW: &str = "settings:edit";
    pub const SETTINGS_MANAGE: &str = "settings:advanced";
    
    // Catalog
    pub const CATALOG_MANAGE: &str = "catalog:manage";
    
    // Customers
    pub const CUSTOMERS_VIEW: &str = "customers:read";
    pub const CUSTOMERS_READ: &str = "customers:read";
    pub const CUSTOMERS_CREATE: &str = "customers:create";
    pub const CUSTOMERS_EDIT: &str = "customers:edit";
    pub const CUSTOMERS_DELETE: &str = "customers:delete";
    pub const CUSTOMERS_VIEW_SENSITIVE: &str = "customers:view_sensitive";
    
    // Suppliers
    pub const SUPPLIERS_VIEW: &str = "suppliers:read";
    pub const SUPPLIERS_READ: &str = "suppliers:read";
    pub const SUPPLIERS_CREATE: &str = "suppliers:create";
    pub const SUPPLIERS_EDIT: &str = "suppliers:edit";
    pub const SUPPLIERS_DELETE: &str = "suppliers:delete";
    pub const SUPPLIERS_VIEW_SENSITIVE: &str = "suppliers:view_sensitive";
    
    // Users
    pub const USERS_VIEW: &str = "users:read";
    pub const USERS_READ: &str = "users:read";
    pub const USERS_CREATE: &str = "users:create";
    pub const USERS_EDIT: &str = "users:edit";
    pub const USERS_DELETE: &str = "users:delete";
    pub const USERS_PERMISSIONS: &str = "users:permissions";
    
    // Pending transactions
    pub const PENDING_READ: &str = "pending:read";
    pub const PENDING_CREATE: &str = "pending:create";
    pub const PENDING_DELETE: &str = "pending:delete";
    
    // Departments
    pub const DEPARTMENTS_CREATE: &str = "departments:create";
    pub const DEPARTMENTS_EDIT: &str = "departments:edit";
    pub const DEPARTMENTS_DELETE: &str = "departments:delete";
    
    // Brands
    pub const BRANDS_CREATE: &str = "brands:create";
    pub const BRANDS_EDIT: &str = "brands:edit";
    pub const BRANDS_DELETE: &str = "brands:delete";
    
    // Attributes
    pub const ATTRIBUTES_CREATE: &str = "attributes:create";
    pub const ATTRIBUTES_EDIT: &str = "attributes:edit";
    pub const ATTRIBUTES_DELETE: &str = "attributes:delete";
    
    // Variants
    pub const VARIANTS_READ: &str = "variants:read";
    pub const VARIANTS_CREATE: &str = "variants:create";
}

pub struct Authorize {
    pub user: User,
    pub permissions: Vec<String>,
}

impl Authorize {
    pub fn has_permission(&self, permission: &str) -> bool {
        self.permissions.contains(&"*".to_string()) || self.permissions.contains(&permission.to_string())
    }
}

impl FromRequest for Authorize {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            // Aquí deberías obtener el usuario y sus permisos desde el token JWT
            // Por ahora, crearemos un usuario mock con todos los permisos
            let user = User {
                id: 1.to_string(),
                name: Some("Admin".to_string()),
                display_name: Some("Admin".to_string()),
                email: Some("admin@example.com".to_string()),
                username: "admin".to_string(),
                password_hash: Some("".to_string()),
                role_id: Some("admin".to_string()),
                status: "Activo".to_string(),
                deleted_at: None,
                deleted_by: None,
                created_at: "".to_string(),
                updated_at: "".to_string(),
            };
            let permissions = vec!["*".to_string()];

            Ok(Authorize {
                user,
                permissions,
            })
        })
    }
}
