-- Script para migrar la tabla inventory_movements a la nueva estructura.
-- Añade las columnas necesarias para el seguimiento de transacciones.

-- Desactiva las claves foráneas para permitir la modificación de la tabla
PRAGMA foreign_keys=off;

-- Inicia una transacción para asegurar que todos los cambios se apliquen o ninguno
BEGIN TRANSACTION;

-- 1. Renombra la tabla original
ALTER TABLE inventory_movements RENAME TO _inventory_movements_old;

-- 2. Crea la nueva tabla `inventory_movements` con el esquema actualizado
CREATE TABLE inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  transaction_id TEXT, -- Se permite NULL temporalmente para la migración
  transaction_date DATETIME, -- Se permite NULL temporalmente para la migración
  entity_name TEXT,
  entity_document TEXT,
  type TEXT CHECK(type IN ('ENTRADA', 'SALIDA', 'RETIRO', 'AUTO-CONSUMO')) NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL,
  price REAL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Activo',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- 3. Copia los datos de la tabla antigua a la nueva, con validación explícita de tipos.
-- Solo se insertan movimientos cuyo producto todavía existe en la tabla `products`.
-- Se usa CASE para forzar un tipo válido si el dato original está corrupto o no es válido.
INSERT INTO inventory_movements (id, product_id, type, quantity, unit_cost, description, status, created_at)
SELECT 
    id, 
    product_id, 
    CASE 
        WHEN type IN ('ENTRADA', 'SALIDA', 'RETIRO', 'AUTO-CONSUMO') THEN type
        ELSE 'AJUSTE-ENTRADA' 
    END,
    COALESCE(quantity, 0),
    unit_cost, 
    description, 
    COALESCE(status, 'Activo'),
    COALESCE(date, strftime('%Y-%m-%d %H:%M:%S', 'now'))
FROM _inventory_movements_old
WHERE product_id IN (SELECT id FROM products);

-- 4. Elimina la tabla antigua
DROP TABLE _inventory_movements_old;

-- Finaliza la transacción
COMMIT;

-- Reactiva las claves foráneas
PRAGMA foreign_keys=on;

-- Opcional: Añade un índice para mejorar el rendimiento de las búsquedas por transaction_id
CREATE INDEX IF NOT EXISTS idx_transaction_id ON inventory_movements (transaction_id);

-- Nota: Después de ejecutar este script, las columnas transaction_id y transaction_date
-- estarán vacías (NULL). El backend deberá ser actualizado para poblarlas en las
-- nuevas transacciones y potencialmente para rellenar las antiguas si es necesario.
