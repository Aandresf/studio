
export interface Product {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  status: 'Activo' | 'Inactivo';
  image?: string;
  // Campos de la BD que se mapean a los de arriba
  current_stock?: number;
  average_cost?: number;
}

export interface DashboardSummary {
    productCount: number;
    totalInventoryValue: number;
    salesCount30d: number;
}

export interface RecentSale {
    productName: string;
    quantity: number;
    date: string;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'RETIRO' | 'AUTO-CONSUMO';

export interface InventoryMovement {
    id: number;
    product_id: number;
    type: MovementType;
    quantity: number;
    unit_cost?: number;
    date: string;
    description?: string;
}

export type ReportType = 'INVENTORY' | 'SALES' | 'PURCHASES';

export interface ReportMetadata {
    id: number;
    start_date: string;
    end_date: string;
    generated_at: string;
}

export interface InventoryReportItem {
    product_id: number;
    name: string;
    sku: string;
    opening_stock: number;
    entradas: number;
    salidas: number;
    closing_stock: number;
}

export interface SalesReportItem {
    product_id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_cost: number;
    date: string;
}

// Purchases report can reuse SalesReportItem
export type PurchasesReportItem = SalesReportItem;

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
