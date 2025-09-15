// src-backend-rust/src/models/mod.rs

pub mod user;
pub mod department;
pub mod brand;
pub mod attribute;
pub mod product;
pub mod customer_supplier;
pub mod inventory_movement;
pub mod transaction;
pub mod search;
pub mod setting;
pub mod stat;
pub mod report;

// Exportamos los modelos para facilitar su importación
pub use user::{User, NewUser, UserUpdate, AuthRequest, AuthResponse, UserResponse};

// Departamentos y Subdepartamentos
pub use department::Department;
pub use department::NewDepartment;
pub use department::UpdateDepartment;
pub use department::Subdepartment;
pub use department::NewSubdepartment;
pub use department::UpdateSubdepartment;

// Marcas
pub use brand::Brand;
pub use brand::NewBrand;
pub use brand::UpdateBrand;

// Atributos y valores de atributos
pub use attribute::Attribute;
pub use attribute::NewAttribute;
pub use attribute::UpdateAttribute;
pub use attribute::AttributeValue;
pub use attribute::NewAttributeValue;
pub use attribute::UpdateAttributeValue;

// Productos y variantes
pub use product::Product;
pub use product::NewProduct;
pub use product::UpdateProduct;
pub use product::ProductDetail;
pub use product::ProductVariant;
pub use product::NewProductVariant;
pub use product::UpdateProductVariant;
pub use product::ProductVariantDetail;
pub use product::ProductVariantAttribute;

// Clientes y proveedores
pub use customer_supplier::Customer;
pub use customer_supplier::NewCustomer;
pub use customer_supplier::UpdateCustomer;
pub use customer_supplier::Supplier;
pub use customer_supplier::NewSupplier;
pub use customer_supplier::UpdateSupplier;

// Movimientos de inventario
pub use inventory_movement::InventoryMovement;
pub use inventory_movement::NewInventoryMovement;
pub use inventory_movement::InventoryMovementDetail;

// Reportes
pub use report::{SalesReport, ProductReport, InventoryReport, CustomerReport, ReportParameters};