// --- Tipos para la gestión de Catálogo y Variantes ---

export interface Brand {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Subdepartment {
  id: number;
  name: string;
  abbreviation: string;
  department_id: number;
  department_name: string;
}

export interface Attribute {
  id: number;
  name: string;
}

export interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  // Some API responses include the attribute name directly
  attribute_name?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  cost_price: number;
  sale_price: number;
  current_stock: number;
  status: 'Activo' | 'Inactivo';
  attribute_values?: AttributeValue[]; // Para mostrar qué valores tiene
}

export interface Product {
  id: number;
  base_sku?: string;
  name: string;
  description?: string;
  department_id?:number;
  subdepartment_id?:number;
  category?: string;
  subcategory?: string;
  brand_id?: number;
  // Some API responses include brand metadata or a denormalized brand_name
  brand?: Brand;
  brand_name?: string;
  status: 'Activo' | 'Inactivo';
  variants?: ProductVariant[]; // Un producto ahora puede tener muchas variantes
}


// --- Tipos para Dashboard y Reportes (se mantendrán y adaptarán) ---

// Forma esperada por el frontend para el resumen del dashboard
export interface DashboardSummary {
  totalRevenue: { value: number; change: number };
  sales: { value: number; change: number };
  totalProducts: { value: number; change: number };
  newCustomers: { value: number; change: number };
}

// RecentSale (coincide con lo que devuelve la API y lo que consume el dashboard)
export interface RecentSale {
  id: string; // transaction id
  productName?: string; // opcional: Producto o detalle corto
  customerName?: string;
  customerEmail?: string;
  status?: 'Completed' | 'Pending' | 'Cancelled' | string;
  date: string;
  amount: number;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'RETIRO' | 'AUTO-CONSUMO' | 'AJUSTE';

export interface InventoryMovement {
    id: number;
    variant_id: number; // Cambiado de product_id a variant_id
    type: MovementType;
    quantity: number;
    unit_cost?: number;
    price?: number;
  date: string;
  // Campos que el backend a veces envía con nombres distintos
  transaction_date?: string;
  document_number?: string;
    description?: string;
}

export type ReportType = 'INVENTORY' | 'SALES' | 'PURCHASES';

export interface ReportMetadata {
    id: number;
    start_date: string;
    end_date: string;
    generated_at: string;
}

export interface FullReport extends ReportMetadata {
    report_data: string; // JSON string
}

export interface StoreSettings {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
}

// --- Tipos para Transacciones (Compras y Ventas) ---

// Se operará a nivel de variante
export interface TransactionItemPayload {
  variantId: number;
  quantity: number;
  unitCost?: number; // Para compras
  unitPrice?: number; // Para ventas
  tax_rate: number;
  description?: string;
}

export interface PurchasePayload {
  transaction_date: string;
  entity_name?: string;
  entity_document?: string;
  document_number?: string;
  items: TransactionItemPayload[];
}

export interface SalePayload {
  transaction_date: string;
  entity_name?: string;
  entity_document?: string;
  document_number?: string;
  items: TransactionItemPayload[];
}

// --- Tipos para Historiales ---

export interface HistoryMovement {
  movementId: number;
  variantId: number;
  productName: string; // "Producto Base"
  variantName: string; // "Valor1 / Valor2"
  quantity: number;
  unit_cost?: number;
  unit_price?: number;
  // Some history movements may include sku in the payload
  sku?: string;
  status: 'Activo' | 'Reemplazado' | 'Anulado';
}

export interface GroupedTransaction {
  transaction_id: string;
  transaction_date: string;
  entity_name: string;
  entity_document: string;
  document_number: string;
  total: number;
  movements: HistoryMovement[];
  status: 'Activo' | 'Anulado' | 'Reemplazado';
}

export type GroupedPurchase = GroupedTransaction;
export type GroupedSale = GroupedTransaction;