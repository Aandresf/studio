
const API_BASE_URL = 'http://localhost:3001/api';

// Generic fetch function
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const config = {
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch if error response is not JSON
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) { // No Content
        return null;
    }

    return response.json();
}

import { Product, DashboardSummary, RecentSale, InventoryMovement, ReportMetadata, FullReport, ReportType, StoreSettings } from './types';

// Product API calls
export const getProducts = (): Promise<Product[]> => fetchAPI('/products');



export const createProduct = (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
    return fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
};

export const updateProduct = (id: number, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<{ message: string }> => {
    return fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    });
};

export const deleteProduct = (id: number): Promise<null> => {
    return fetchAPI(`/products/${id}`, {
        method: 'DELETE',
    });
};

// Dashboard API calls
import { DashboardSummary, RecentSale } from './types';

export const getDashboardSummary = (): Promise<DashboardSummary> => fetchAPI('/dashboard/summary');
export const getRecentSales = (): Promise<RecentSale[]> => fetchAPI('/dashboard/recent-sales');

// Inventory Movements API calls
export const createInventoryMovement = (movement: Omit<InventoryMovement, 'id' | 'date'>): Promise<{ message: string }> => {
    return fetchAPI('/inventory/movements', {
        method: 'POST',
        body: JSON.stringify(movement),
    });
};

// Reports API calls
export const getReports = (): Promise<ReportMetadata[]> => fetchAPI('/reports');

export const createReport = (type: ReportType, startDate: string, endDate: string): Promise<FullReport> => {
    return fetchAPI(`/reports/${type.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate }),
    });
};

export const getReportById = (id: number): Promise<FullReport> => fetchAPI(`/reports/${id}`);

// Settings API calls
export const getStoreSettings = (): Promise<StoreSettings> => fetchAPI('/settings/store');

export const updateStoreSettings = (settings: StoreSettings): Promise<{ message: string }> => {
    return fetchAPI('/settings/store', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
};

export const backupDatabase = (): Promise<{ message: string }> => fetchAPI('/database/backup', { method: 'POST' });
