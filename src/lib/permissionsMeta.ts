export type PermissionCategory = 'ventas' | 'compras' | 'productos' | 'configuracion' | 'usuarios' | 'general';

export interface PermissionMeta {
  key: string;
  label: string;
  description: string;
  category: PermissionCategory;
  affected: string[]; // short list of buttons or UI areas affected
  requires?: string[]; // permisos necesarios para que este permiso funcione correctamente
}

export const PERMISSIONS_META: PermissionMeta[] = [
  { key: '*', label: 'Acceso total', description: 'Permite todas las operaciones en la aplicación.', category: 'general', affected: ['Todos'] },

  // Ventas
  { key: 'sales:create', label: 'Crear ventas', description: 'Permite crear/registrar nuevas ventas.', category: 'ventas', affected: ['Registrar Venta', 'Guardar Cambios'] },
  { key: 'sales:read', label: 'Ver ventas', description: 'Permite ver el historial y recibos de ventas.', category: 'ventas', affected: ['Historial', 'Ver Recibo'] },
  { key: 'sales:edit', label: 'Editar ventas', description: 'Permite editar ventas activas.', category: 'ventas', affected: ['Editar Venta', 'Guardar Cambios'] },
  { key: 'sales:annul', label: 'Anular ventas', description: 'Permite anular/invalidar ventas y revertir stock.', category: 'ventas', affected: ['Anular Venta'] },
  { key: 'sales:delete', label: 'Eliminar ventas (pendientes)', description: 'Permite eliminar ventas pendientes guardadas.', category: 'ventas', affected: ['Eliminar (pendiente)'] },

  // Compras
  { key: 'purchases:read', label: 'Ver compras', description: 'Permite ver el historial y recibos de compras.', category: 'compras', affected: ['Historial', 'Ver Recibo'] },
  { key: 'purchases:create', label: 'Crear compras', description: 'Permite registrar nuevas compras.', category: 'compras', affected: ['Registrar Compra', 'Guardar Cambios'] },
  { key: 'purchases:edit', label: 'Editar compras', description: 'Permite editar compras activas.', category: 'compras', affected: ['Editar Compra'] },
  { key: 'purchases:annul', label: 'Anular compras', description: 'Permite anular compras y revertir stock.', category: 'compras', affected: ['Anular Compra'] },
  { key: 'purchases:delete', label: 'Eliminar compras (pendientes)', description: 'Permite eliminar compras pendientes guardadas.', category: 'compras', affected: ['Eliminar (pendiente)'] },

  // Productos
  { key: 'products:read', label: 'Ver productos', description: 'Permite ver la lista de productos y detalles.', category: 'productos', affected: ['Listado Productos', 'Detalle Producto'] },
  { key: 'products:create', label: 'Crear productos', description: 'Permite crear nuevos productos y variantes.', category: 'productos', affected: ['Crear Producto', 'Guardar Producto'] },
  { key: 'products:edit', label: 'Editar productos', description: 'Permite editar productos y variantes.', category: 'productos', affected: ['Editar Producto', 'Guardar Producto'] },
  { key: 'products:delete', label: 'Eliminar productos', description: 'Permite borrar productos.', category: 'productos', affected: ['Eliminar Producto'] },
  { key: 'products:read_prices_sale', label: 'Ver precios de venta', description: 'Permite ver los precios de venta en la interfaz.', category: 'productos', affected: ['Precio de Venta'] },
  { key: 'products:read_costs', label: 'Ver costes', description: 'Permite ver los costes de producto en vistas autorizadas.', category: 'productos', affected: ['Coste Unitario', 'Detalle Producto'] },
  { key: 'products:read_costs_disabled', label: 'Ver costes (desactivado)', description: 'Versión restringida para costes (no editable).', category: 'productos', affected: ['Coste Unitario'] },
  // permisos requeridos: crear producto necesita leer catálogo (marcas, departamentos, atributos, variantes)
  { key: 'products:manual_sku', label: 'Editar SKU manualmente', description: 'Permite editar manualmente el SKU base del producto desde el formulario de producto.', category: 'productos', affected: ['Editar SKU', 'Formulario Producto'], requires: ['brands:read','departments:read','attributes:read','variants:read'] },
  { key: 'products:manual_sku', label: 'Editar SKU manualmente', description: 'Permite editar manualmente el SKU base del producto desde el formulario de producto.', category: 'productos', affected: ['Editar SKU', 'Formulario Producto'] },

  // Reportes y dashboard (general)
  { key: 'reports:read', label: 'Ver reportes', description: 'Permite acceder a los reportes del sistema.', category: 'general', affected: ['Panel de Reportes'] },
  { key: 'dashboard:read', label: 'Ver panel', description: 'Permite ver el panel principal (dashboard).', category: 'general', affected: ['Dashboard'] },
  { key: 'reports:create_snapshot', label: 'Crear snapshot', description: 'Permite crear snapshots/instantáneas de inventario.', category: 'general', affected: ['Crear Snapshot'] },

  // Settings / Configuración
  { key: 'settings:edit', label: 'Editar configuración', description: 'Permite modificar configuraciones del sistema.', category: 'configuracion', affected: ['Ajustes'] },
  { key: 'settings:advanced', label: 'Acceder configuración avanzada', description: 'Permite acceder y modificar opciones de configuración avanzada.', category: 'configuracion', affected: ['Configuración Avanzada'] },
  { key: 'catalog:manage', label: 'Gestionar catálogo', description: 'Permite modificar la configuración del catálogo: departamentos, marcas, atributos y otras opciones relacionadas con el catálogo de productos.', category: 'configuracion', affected: ['Catálogo', 'Departamentos', 'Marcas', 'Atributos'] },
  { key: 'stores:create', label: 'Crear sucursales', description: 'Permite crear nuevas sucursales/tiendas.', category: 'configuracion', affected: ['Crear Tienda'] },
  { key: 'stores:delete', label: 'Eliminar sucursales', description: 'Permite eliminar sucursales/tiendas.', category: 'configuracion', affected: ['Eliminar Tienda'] },
  { key: 'stores:set_active', label: 'Seleccionar tienda activa', description: 'Permite cambiar la tienda activa.', category: 'configuracion', affected: ['Seleccionar Tienda'] },

  // Usuarios
  { key: 'users:create', label: 'Crear usuarios', description: 'Permite crear nuevos usuarios del sistema.', category: 'usuarios', affected: ['Crear Usuario'] },
  { key: 'users:edit', label: 'Editar usuarios', description: 'Permite editar usuarios existentes.', category: 'usuarios', affected: ['Editar Usuario'] },
  { key: 'users:delete', label: 'Eliminar usuarios', description: 'Permite eliminar usuarios del sistema.', category: 'usuarios', affected: ['Eliminar Usuario'] },
  { key: 'users:permissions', label: 'Gestionar permisos', description: 'Permite asignar permisos a otros usuarios.', category: 'usuarios', affected: ['Editor de Permisos'] },

  // Inventario y pendientes
  { key: 'inventory:write', label: 'Modificar inventario', description: 'Permite operaciones de escritura sobre inventario (ajustes manuales).', category: 'general', affected: ['Ajustar Stock'] },
  { key: 'pending:create', label: 'Guardar pendientes', description: 'Permite guardar transacciones en estado pendiente.', category: 'general', affected: ['Poner en Espera'] },
  { key: 'pending:delete', label: 'Eliminar pendientes', description: 'Permite eliminar transacciones pendientes.', category: 'general', affected: ['Eliminar (pendiente)'] },

  // Admin
  { key: 'admin:backup', label: 'Backup', description: 'Permite generar backups del sistema.', category: 'general', affected: ['Backup'] },
  { key: 'admin:restore', label: 'Restaurar', description: 'Permite restaurar desde backups.', category: 'general', affected: ['Restaurar'] },

  // Departments / Brands / Attributes management (configuración avanzada)
  { key: 'departments:create', label: 'Crear departamentos', description: 'Permite crear departamentos (clasificación de productos).', category: 'configuracion', affected: ['Nuevo Departamento'] },
  { key: 'departments:edit', label: 'Editar departamentos', description: 'Permite editar departamentos.', category: 'configuracion', affected: ['Editar Departamento'] },
  { key: 'departments:delete', label: 'Eliminar departamentos', description: 'Permite eliminar departamentos.', category: 'configuracion', affected: ['Eliminar Departamento'] },

  { key: 'brands:create', label: 'Crear marcas', description: 'Permite añadir nuevas marcas.', category: 'configuracion', affected: ['Añadir Marca'] },
  { key: 'brands:edit', label: 'Editar marcas', description: 'Permite editar marcas existentes.', category: 'configuracion', affected: ['Editar Marca'] },
  { key: 'brands:delete', label: 'Eliminar marcas', description: 'Permite eliminar marcas.', category: 'configuracion', affected: ['Eliminar Marca'] },

  { key: 'attributes:create', label: 'Crear atributos', description: 'Permite crear nuevos atributos (talla, color...).', category: 'configuracion', affected: ['Añadir Atributo'] },
  { key: 'attributes:edit', label: 'Editar atributos', description: 'Permite editar atributos.', category: 'configuracion', affected: ['Editar Atributo'] },
  { key: 'attributes:delete', label: 'Eliminar atributos', description: 'Permite eliminar atributos.', category: 'configuracion', affected: ['Eliminar Atributo'] },
  { key: 'attributes:create_value', label: 'Crear valores de atributo', description: 'Permite crear valores para atributos (ej. Color: Rojo).', category: 'configuracion', affected: ['Añadir Valor'] },
  { key: 'attributes:edit_value', label: 'Editar valor de atributo', description: 'Permite editar valores de atributos.', category: 'configuracion', affected: ['Editar Valor'] },
  { key: 'attributes:delete_value', label: 'Eliminar valor de atributo', description: 'Permite eliminar valores de atributos.', category: 'configuracion', affected: ['Eliminar Valor'] },
];

export const CATEGORIES_DISPLAY: Record<PermissionCategory, string> = {
  ventas: 'Ventas',
  compras: 'Compras',
  productos: 'Productos',
  configuracion: 'Configuración',
  usuarios: 'Usuarios',
  general: 'General'
};
