export type PermissionCategory = 'ventas' | 'compras' | 'productos' | 'configuracion' | 'usuarios' | 'general' | 'catalogo' | 'clientes' | 'proveedores';

export interface PermissionMeta {
  key: string;
  label: string;
  description: string;
  category: PermissionCategory;
  affected: string[]; // short list of buttons or UI areas affected
  requires?: string[]; // permisos necesarios para que este permiso funcione correctamente
}
// Mapeo manual de metadatos descriptivos por clave. Solo contenido legible (labels, descriptions, affected, category)
const METADATA_MAP: Record<string, Partial<PermissionMeta>> = {
  '*': { label: 'Acceso total', description: 'Permite todas las operaciones en la aplicación.', category: 'general', affected: ['Todos'] },
  'sales:create': { label: 'Crear ventas', description: 'Permite crear/registrar nuevas ventas.', category: 'ventas', affected: ['Registrar Venta', 'Guardar Cambios'] },
  'sales:read': { label: 'Ver ventas', description: 'Permite ver el historial y recibos de ventas.', category: 'ventas', affected: ['Historial', 'Ver Recibo'] },
  'sales:edit': { label: 'Editar ventas', description: 'Permite editar ventas activas.', category: 'ventas', affected: ['Editar Venta', 'Guardar Cambios'] },
  'sales:annul': { label: 'Anular ventas', description: 'Permite anular/invalidar ventas y revertir stock.', category: 'ventas', affected: ['Anular Venta'] },
  'sales:delete': { label: 'Eliminar ventas (pendientes)', description: 'Permite eliminar ventas pendientes guardadas.', category: 'ventas', affected: ['Eliminar (pendiente)'] },
  'sales:edit_price': { label: 'Editar precio en venta', description: 'Permite modificar el precio de venta al momento de crear una venta.', category: 'ventas', affected: ['Precio Unit. en carrito'] },
  'sales:edit_invoice': { label: 'Editar nº de factura (ventas)', description: 'Permite modificar manualmente el número de factura al registrar una venta.', category: 'ventas', affected: ['Nº de Factura'] },

  'purchases:read': { label: 'Ver compras', description: 'Permite ver el historial y recibos de compras.', category: 'compras', affected: ['Historial', 'Ver Recibo'] },
  'purchases:create': { label: 'Crear compras', description: 'Permite registrar nuevas compras.', category: 'compras', affected: ['Registrar Compra', 'Guardar Cambios'] },
  'purchases:edit': { label: 'Editar compras', description: 'Permite editar compras activas.', category: 'compras', affected: ['Editar Compra'] },
  'purchases:annul': { label: 'Anular compras', description: 'Permite anular compras y revertir stock.', category: 'compras', affected: ['Anular Compra'] },
  'purchases:delete': { label: 'Eliminar compras (pendientes)', description: 'Permite eliminar compras pendientes guardadas.', category: 'compras', affected: ['Eliminar (pendiente)'] },

  'products:read': { label: 'Ver productos', description: 'Permite ver la lista de productos y detalles.', category: 'productos', affected: ['Listado Productos', 'Detalle Producto'] },
  'products:create': { label: 'Crear productos', description: 'Permite crear nuevos productos y variantes.', category: 'productos', affected: ['Crear Producto', 'Guardar Producto'] },
  'products:edit': { label: 'Editar productos', description: 'Permite editar productos y variantes.', category: 'productos', affected: ['Editar Producto', 'Guardar Producto'] },
  'products:delete': { label: 'Eliminar productos', description: 'Permite borrar productos.', category: 'productos', affected: ['Eliminar Producto'] },
  'products:read_prices_sale': { label: 'Ver precios de venta', description: 'Permite ver los precios de venta en la interfaz.', category: 'productos', affected: ['Precio de Venta'] },
  'products:read_costs': { label: 'Ver costes', description: 'Permite ver los costes de producto en vistas autorizadas.', category: 'productos', affected: ['Coste Unitario', 'Detalle Producto'] },
  'products:read_costs_disabled': { label: 'Ver costes (desactivado)', description: 'Versión restringida para costes (no editable).', category: 'productos', affected: ['Coste Unitario'] },
  'products:manual_sku': { label: 'Editar SKU manualmente', description: 'Permite editar manualmente el SKU base del producto desde el formulario de producto.', category: 'productos', affected: ['Editar SKU', 'Formulario Producto'] },

  // Admin
  'admin:backup': { label: 'Generar backup', description: 'Permite generar una copia de seguridad del sistema.', category: 'general', affected: ['Backup'] },
  'admin:restore': { label: 'Restaurar backup', description: 'Permite restaurar la base de datos desde una copia de seguridad.', category: 'general', affected: ['Restaurar'] },

  // Reports / Dashboard
  'reports:read': { label: 'Ver reportes', description: 'Permite acceder y visualizar reportes e informes del sistema.', category: 'general', affected: ['Panel de Reportes'] },
  'reports:create_snapshot': { label: 'Crear snapshot', description: 'Permite generar una instantánea (snapshot) del inventario actual.', category: 'general', affected: ['Crear Snapshot'] },
  'dashboard:read': { label: 'Ver panel', description: 'Permite ver el panel principal (dashboard) con métricas y widgets.', category: 'general', affected: ['Dashboard'] },

  // Settings / Configuración
  'settings:edit': { label: 'Editar configuración', description: 'Permite modificar ajustes generales de la aplicación.', category: 'configuracion', affected: ['Ajustes'] },
  'settings:advanced': { label: 'Acceder configuración avanzada', description: 'Permite acceder y modificar opciones avanzadas del sistema (riesgo alto).', category: 'configuracion', affected: ['Configuración Avanzada'] },
  'catalog:manage': { label: 'Gestionar catálogo', description: 'Permite realizar operaciones avanzadas sobre catálogo: departamentos, marcas y atributos.', category: 'configuracion', affected: ['Catálogo', 'Departamentos', 'Marcas', 'Atributos'] },

  // Stores
  'stores:create': { label: 'Crear sucursales', description: 'Permite añadir nuevas sucursales/tiendas al sistema.', category: 'configuracion', affected: ['Crear Tienda'] },
  'stores:delete': { label: 'Eliminar sucursales', description: 'Permite eliminar sucursales/tiendas y sus configuraciones asociadas.', category: 'configuracion', affected: ['Eliminar Tienda'] },
  'stores:set_active': { label: 'Seleccionar tienda activa', description: 'Permite cambiar la tienda/sucursal activa en la sesión.', category: 'configuracion', affected: ['Seleccionar Tienda'] },

  // Departments
  'departments:create': { label: 'Crear departamentos', description: 'Permite crear nuevos departamentos para clasificar productos.', category: 'catalogo', affected: ['Nuevo Departamento'] },
  'departments:edit': { label: 'Editar departamentos', description: 'Permite modificar departamentos existentes.', category: 'catalogo', affected: ['Editar Departamento'] },
  'departments:delete': { label: 'Eliminar departamentos', description: 'Permite eliminar departamentos del catálogo.', category: 'catalogo', affected: ['Eliminar Departamento'] },

  // Brands
  'brands:create': { label: 'Crear marcas', description: 'Permite añadir nuevas marcas al catálogo.', category: 'catalogo', affected: ['Añadir Marca'] },
  'brands:edit': { label: 'Editar marcas', description: 'Permite modificar datos de marcas existentes.', category: 'catalogo', affected: ['Editar Marca'] },
  'brands:delete': { label: 'Eliminar marcas', description: 'Permite eliminar marcas del catálogo.', category: 'catalogo', affected: ['Eliminar Marca'] },

  // Attributes
  'attributes:create': { label: 'Crear atributos', description: 'Permite crear atributos (ej. talla, color) usados por productos.', category: 'catalogo', affected: ['Añadir Atributo'] },
  'attributes:edit': { label: 'Editar atributos', description: 'Permite editar atributos existentes.', category: 'catalogo', affected: ['Editar Atributo'] },
  'attributes:delete': { label: 'Eliminar atributos', description: 'Permite eliminar atributos del sistema.', category: 'catalogo', affected: ['Eliminar Atributo'] },
  'attributes:create_value': { label: 'Crear valor de atributo', description: 'Permite añadir valores a un atributo (ej. Color: Rojo).', category: 'catalogo', affected: ['Añadir Valor'] },
  'attributes:edit_value': { label: 'Editar valor de atributo', description: 'Permite editar valores de atributos.', category: 'catalogo', affected: ['Editar Valor'] },
  'attributes:delete_value': { label: 'Eliminar valor de atributo', description: 'Permite eliminar valores de atributos.', category: 'catalogo', affected: ['Eliminar Valor'] },

  // Variants
  'variants:read': { label: 'Ver variantes', description: 'Permite ver variantes asociadas a productos.', category: 'catalogo', affected: ['Listado Variantes', 'Detalle Producto'] },
  'variants:create': { label: 'Crear variantes', description: 'Permite crear nuevas variantes para un producto (tallas, colores).', category: 'catalogo', affected: ['Añadir Variante'] },

  // Inventory / pending
  'inventory:write': { label: 'Modificar inventario', description: 'Permite realizar ajustes manuales en inventario.', category: 'general', affected: ['Ajustar Stock'] },
  'pending:create': { label: 'Guardar pendientes', description: 'Permite guardar transacciones en estado pendiente.', category: 'general', affected: ['Poner en Espera'] },
  'pending:delete': { label: 'Eliminar pendientes', description: 'Permite eliminar transacciones pendientes.', category: 'general', affected: ['Eliminar (pendiente)'] },

  // Users
  'users:create': { label: 'Crear usuarios', description: 'Permite crear nuevas cuentas de usuario en el sistema.', category: 'usuarios', affected: ['Crear Usuario'] },
  'users:edit': { label: 'Editar usuarios', description: 'Permite editar información de usuarios existentes.', category: 'usuarios', affected: ['Editar Usuario'] },
  'users:delete': { label: 'Eliminar usuarios', description: 'Permite eliminar usuarios del sistema.', category: 'usuarios', affected: ['Eliminar Usuario'] },
  'users:permissions': { label: 'Gestionar permisos', description: 'Permite asignar y modificar permisos de otros usuarios.', category: 'usuarios', affected: ['Editor de Permisos'] },
  // Customers
  'customers:read': { label: 'Ver clientes', description: 'Permite ver la lista y fichas de clientes.', category: 'clientes', affected: ['Clientes'] },
  'customers:create': { label: 'Crear clientes', description: 'Permite crear nuevos clientes en el sistema.', category: 'clientes', affected: ['Nuevo Cliente'] },
  'customers:edit': { label: 'Editar clientes', description: 'Permite editar la información de clientes.', category: 'clientes', affected: ['Editar Cliente'] },
  'customers:delete': { label: 'Eliminar clientes', description: 'Permite eliminar clientes del sistema.', category: 'clientes', affected: ['Eliminar Cliente'] },
  'customers:view_sensitive': { label: 'Ver datos sensibles de clientes', description: 'Permite ver datos personales sensibles (DNI, teléfono, correo) en la ficha de cliente.', category: 'clientes', affected: ['DNI Cliente', 'Teléfono', 'Email'] },
  // Suppliers
  'suppliers:read': { label: 'Ver proveedores', description: 'Permite ver la lista y fichas de proveedores.', category: 'proveedores', affected: ['Proveedores'] },
  'suppliers:create': { label: 'Crear proveedores', description: 'Permite crear nuevos proveedores en el sistema.', category: 'proveedores', affected: ['Nuevo Proveedor'] },
  'suppliers:edit': { label: 'Editar proveedores', description: 'Permite editar la información de proveedores.', category: 'proveedores', affected: ['Editar Proveedor'] },
  'suppliers:delete': { label: 'Eliminar proveedores', description: 'Permite eliminar proveedores del sistema.', category: 'proveedores', affected: ['Eliminar Proveedor'] },
  'suppliers:view_sensitive': { label: 'Ver datos sensibles de proveedores', description: 'Permite ver datos sensibles de proveedores (RIF, cuentas, contactos) en la ficha de proveedor.', category: 'proveedores', affected: ['RIF', 'Cuenta', 'Contactos'] },
};

// Cached permissions list (empty by default). Components should call loadPermissionsMeta()
// during mount to populate this cache.
let CACHED_PERMISSIONS: PermissionMeta[] = [];

export async function loadPermissionsMeta(apiBase?: string): Promise<PermissionMeta[]> {
  // apiBase may be provided like 'http://host:3001' or '' for same-origin.
  const base = (apiBase || '').replace(/\/$/, '');
  const url = base ? `${base}/api/meta/permissions` : '/api/meta/permissions';
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed fetching permissions metadata');
    const body = await res.json();
    const list = (body?.permissions || []).map((p: any) => {
      const meta = METADATA_MAP[p.key] || {};
      return {
        key: p.key,
        label: meta.label || p.key,
        description: meta.description || '',
        category: (meta.category as PermissionCategory) || 'general',
        affected: meta.affected || [],
        requires: (p as any).requires || undefined
      } as PermissionMeta;
    });
    CACHED_PERMISSIONS = list;
    return list;
  } catch (err) {
    console.error('Error loading permissions meta:', (err as any)?.message || String(err));
    return CACHED_PERMISSIONS;
  }
}

// Synchronous accessor for code that expects it. May be empty until loadPermissionsMeta() completes.
export function getPermissionsMetaSync(): PermissionMeta[] {
  return CACHED_PERMISSIONS;
}

export const CATEGORIES_DISPLAY: Record<PermissionCategory, string> = {
  ventas: 'Ventas',
  compras: 'Compras',
  productos: 'Productos',
  configuracion: 'Configuración',
  catalogo: 'Catálogo',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  usuarios: 'Usuarios',
  general: 'General'
};
