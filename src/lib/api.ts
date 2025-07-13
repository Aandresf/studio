
import { toastError } from "@/hooks/use-toast";
import { Product, DashboardSummary, RecentSale, InventoryMovement, ReportMetadata, FullReport, ReportType, StoreSettings, PurchasePayload, SalePayload, PurchaseHistoryMovement, SalesHistoryMovement } from './types';

const API_BASE_URL = 'http://localhost:3001/api';

// Generic fetch function
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const config: RequestInit = {
        ...options,
        headers,
    };

    console.log(`--- API Request ---
    URL: ${url}
    Method: ${config.method || 'GET'}
    Body: ${config.body ? config.body : 'No Body'}
    -------------------`);

    try {
        const response = await fetch(url, config);
        const responseBody = await response.text();

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseBody);
            } catch {
                errorData = { error: 'El servidor respondió con un error inesperado.', details: responseBody };
            }
            const errorMessage = errorData.error || `Error HTTP: ${response.status}`;
            
            console.error(`--- API Error Response ---
            URL: ${url}
            Status: ${response.status}
            Body: ${responseBody}
            ------------------------`);
            
            toastError("Error de API", errorMessage);
            throw new Error(errorMessage);
        }

        if (response.status === 204 || responseBody.length === 0) {
            console.log(`--- API Success Response (No Content) ---
            URL: ${url}
            Status: 204
            ---------------------------------------`);
            return null;
        }

        const jsonData = JSON.parse(responseBody);
        console.log(`--- API Success Response ---
        URL: ${url}
        Status: ${response.status}
        Response Body:`, jsonData,
        `\n----------------------------`);

        return jsonData;
    } catch (error) {
        if (!(error instanceof Error && error.message.includes('Error de API'))) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error de red o de conexión.';
            console.error(`--- Network or Parsing Error ---
            URL: ${url}
            Error: ${message}
            --------------------------------`);
            toastError("Error de Conexión", message);
        }
        throw error;
    }
}


// Product API calls
export const getProducts = (): Promise<Product[]> => fetchAPI('/products');
export const getProductMovements = (productId: number): Promise<InventoryMovement[]> => fetchAPI(`/products/${productId}/movements`);

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

export const annulPurchase = (payload: { movementIds: number[] }): Promise<{ message: string }> => {
    return fetchAPI('/purchases', {
        method: 'DELETE',
        body: JSON.stringify(payload),
    });
};

export const getPurchaseDetails = (transactionId: string): Promise<PurchasePayload> => {
    return fetchAPI(`/purchases/details?id=${encodeURIComponent(transactionId)}`);
};

// Sale API calls
export const getSalesHistory = (): Promise<SalesHistoryMovement[]> => fetchAPI('/sales');

export const getSaleDetails = (transactionId: string): Promise<SalePayload> => {
    return fetchAPI(`/sales/details?id=${encodeURIComponent(transactionId)}`);
};

export const createSale = (sale: SalePayload): Promise<{ message: string }> => {
    return fetchAPI('/sales', {
        method: 'POST',
        body: JSON.stringify(sale),
    });
};

export const updateSale = (payload: { movementIdsToAnnul: number[], saleData: SalePayload }): Promise<{ message:string }> => {
    return fetchAPI('/sales', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};

export const annulSale = (payload: { movementIds: number[] }): Promise<{ message: string }> => {
    return fetchAPI('/sales', {
        method: 'DELETE',
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

export const exportInventoryToExcel = async (startDate: string, endDate: string): Promise<void> => {
    const url = `${API_BASE_URL}/reports/inventory-excel`;
    console.log(`--- API Request (Excel Export) ---
    URL: ${url}
    Method: POST
    Body: ${{ startDate, endDate }}
    -------------------`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: 'El servidor respondió con un error inesperado durante la exportación.', details: errorText };
            }
            const errorMessage = errorData.error || `Error HTTP: ${response.status}`;
            toastError("Error de Exportación", errorMessage);
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        // Extraer el nombre del archivo de la cabecera Content-Disposition si existe, si não, usar uno por defecto.
        const disposition = response.headers.get('content-disposition');
        let filename = `reporte-inventario-${startDate}-a-${endDate}.xlsx`;
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        if (!(error instanceof Error && error.message.includes('Error de Exportación'))) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error de red o de conexión.';
            toastError("Error de Conexión", message);
        }
        throw error;
    }
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
