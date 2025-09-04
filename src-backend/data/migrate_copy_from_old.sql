-- Migration script: copy data from old DB into this (new) DB
ATTACH DATABASE 'c:/PROGRAMACION/INVENTARIO/studio/src-backend/data/database_disveliz_diaz_studio_848V.db' AS old;
BEGIN TRANSACTION;
-- Copy tables
INSERT OR IGNORE INTO main.brands SELECT * FROM old.brands;
INSERT OR IGNORE INTO main.departments SELECT * FROM old.departments;
INSERT OR IGNORE INTO main.subdepartments SELECT * FROM old.subdepartments;
INSERT OR IGNORE INTO main.product_sequences SELECT * FROM old.product_sequences;
INSERT OR IGNORE INTO main.products SELECT * FROM old.products;
INSERT OR IGNORE INTO main.attributes SELECT * FROM old.attributes;
INSERT OR IGNORE INTO main.attribute_values SELECT * FROM old.attribute_values;
INSERT OR IGNORE INTO main.product_variants SELECT * FROM old.product_variants;
INSERT OR IGNORE INTO main.variant_attribute_values SELECT * FROM old.variant_attribute_values;
INSERT OR IGNORE INTO main.inventory_movements SELECT * FROM old.inventory_movements;
INSERT OR IGNORE INTO main.inventory_snapshots SELECT * FROM old.inventory_snapshots;
INSERT OR IGNORE INTO main.users SELECT * FROM old.users;
INSERT OR IGNORE INTO main.roles SELECT * FROM old.roles;
INSERT OR IGNORE INTO main.permissions SELECT * FROM old.permissions;
INSERT OR IGNORE INTO main.role_permissions SELECT * FROM old.role_permissions;
INSERT OR IGNORE INTO main.user_permissions SELECT * FROM old.user_permissions;
INSERT OR IGNORE INTO main.customers SELECT * FROM old.customers;
INSERT OR IGNORE INTO main.suppliers SELECT * FROM old.suppliers;
INSERT OR IGNORE INTO main.inventory_reports SELECT * FROM old.inventory_reports;
INSERT OR IGNORE INTO main.document_counters SELECT * FROM old.document_counters;
COMMIT;
DETACH DATABASE old;

-- Done
