ATTACH DATABASE 'c:/PROGRAMACION/INVENTARIO/studio/src-backend/data/database_disveliz_diaz_studio_848V.db' AS old;
BEGIN TRANSACTION;
-- users: map columns present in old to new
INSERT OR IGNORE INTO main.users (id, username, display_name, email, role_id, password_hash, created_at, updated_at)
SELECT id, username, display_name, email, role_id, password_hash, created_at, updated_at FROM old.users;

-- roles (should match)
INSERT OR IGNORE INTO main.roles SELECT * FROM old.roles;
-- permissions
INSERT OR IGNORE INTO main.permissions SELECT * FROM old.permissions;
-- role_permissions
INSERT OR IGNORE INTO main.role_permissions SELECT * FROM old.role_permissions;
-- user_permissions
INSERT OR IGNORE INTO main.user_permissions SELECT * FROM old.user_permissions;

-- brands, departments, subdepartments
INSERT OR IGNORE INTO main.brands SELECT * FROM old.brands;
INSERT OR IGNORE INTO main.departments SELECT * FROM old.departments;
INSERT OR IGNORE INTO main.subdepartments SELECT * FROM old.subdepartments;

-- product_sequences, products (products schema in new should be correct)
INSERT OR IGNORE INTO main.product_sequences SELECT * FROM old.product_sequences;
INSERT OR IGNORE INTO main.products SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, created_at, updated_at FROM old.products;

-- attributes and attribute_values
INSERT OR IGNORE INTO main.attributes SELECT * FROM old.attributes;
INSERT OR IGNORE INTO main.attribute_values SELECT * FROM old.attribute_values;

-- variants and pivots
INSERT OR IGNORE INTO main.product_variants SELECT * FROM old.product_variants;
INSERT OR IGNORE INTO main.variant_attribute_values SELECT * FROM old.variant_attribute_values;

-- inventory tables
INSERT OR IGNORE INTO main.inventory_movements SELECT * FROM old.inventory_movements;
INSERT OR IGNORE INTO main.inventory_snapshots SELECT * FROM old.inventory_snapshots;

-- other tables
INSERT OR IGNORE INTO main.customers SELECT * FROM old.customers;
INSERT OR IGNORE INTO main.suppliers SELECT * FROM old.suppliers;
INSERT OR IGNORE INTO main.inventory_reports SELECT * FROM old.inventory_reports;
INSERT OR IGNORE INTO main.document_counters SELECT * FROM old.document_counters;

COMMIT;
DETACH DATABASE old;

-- Done
