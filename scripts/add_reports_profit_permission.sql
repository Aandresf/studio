-- Agregar permiso reports:profit y asignarlo a un rol o usuario
-- Asegúrate de ajustar role_id o user_id según tu base de datos.

BEGIN TRANSACTION;

-- 1) Insertar permiso si no existe
INSERT INTO permissions (key, label, description)
SELECT 'reports:profit', 'Informes - Ganancias', 'Acceso a reportes de ganancias (profits)'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = 'reports:profit');

-- 2) Obtener el id del permiso insertado
-- (nota: SQLite no permite variables simples; usamos subconsultas al insertar en role_permissions)

-- 3) Asignar permiso al rol administrador (ejemplo: role_id = 1). Ajusta role_id según tu DB.
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p WHERE p.key = 'reports:profit' AND NOT EXISTS(
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = 1 AND rp.permission_id = p.id
);

-- 4) (Opcional) Asignar permiso directamente al usuario master (ejemplo user_id = 1)
INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
SELECT 1, p.id FROM permissions p WHERE p.key = 'reports:profit' AND NOT EXISTS(
    SELECT 1 FROM user_permissions up WHERE up.user_id = 1 AND up.permission_id = p.id
);

COMMIT;

-- USO:
-- sqlite3 src-backend/data/<tu_db>.db < scripts/add_reports_profit_permission.sql
-- Reemplaza role_id=1 / user_id=1 con los ids correctos en tu base de datos.
