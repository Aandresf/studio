
import { toastError } from "@/hooks/use-toast";
import { Product, DashboardSummary, RecentSale, InventoryMovement, ReportMetadata, FullReport, ReportType, StoreSettings, PurchasePayload } from './types';

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

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'El servidor respondió con un error inesperado.' }));
            const errorMessage = errorData.error || `Error HTTP: ${response.status}`;
            
            // Usamos el nuevo toast para mostrar el error
            toastError("Error de API", errorMessage);

            // Relanzamos el error para que el componente que llama a la API pueda manejarlo
            throw new Error(errorMessage);
        }

        if (response.status === 204) { // No Content
            return null;
        }

        return response.json();
    } catch (error) {
        // Si el error no fue lanzado por nosotros (ej. error de red), lo mostramos también.
        if (!(error instanceof Error && error.message.includes('Error de API'))) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error de red o de conexión.';
            toastError("Error de Conexión", message);
        }
        // Relanzamos el error para que la lógica de la UI pueda reaccionar.
        throw error;
    }
}


// Product API calls
export const getProducts = (): Promise<Product[]> => fetchAPI('/products');

export const createProduct = (product: Partial<Product>): Promise<Product> => {
    return fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
};

export const updateProduct = (id: number, product: Partial<Product>): Promise<{ message: string }> => {
    console.log(JSON.stringify(product));
    return fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    });
};

export const deleteProduct = (id: number): Promise<null> => {
    console.log(`Deleting product with ID: ${id}`);
    return fetchAPI(`/products/${id}`, {
        method: 'DELETE',
    });
};

// Purchase API call
export const createPurchase = (purchase: PurchasePayload): Promise<{ message: string }> => {
    return fetchAPI('/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase),
    });
};

export const getPurchaseHistory = (): Promise<PurchaseHistoryMovement[]> => fetchAPI('/purchases');

export const updatePurchase = (payload: { movementIdsToAnnul: number[], purchaseData: PurchasePayload }): Promise<{ message: string }> => {
    return fetchAPI('/purchases', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};


// Dashboard API calls
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
