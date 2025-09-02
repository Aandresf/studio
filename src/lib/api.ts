
import { toastError, toastInfo } from "@/hooks/use-toast";
import { Product, DashboardSummary, RecentSale, InventoryMovement, ReportMetadata, FullReport, ReportType, StoreSettings, PurchasePayload, SalePayload, GroupedPurchase, GroupedSale } from './types';

// Use NEXT_PUBLIC_API_URL at build/runtime if provided, otherwise default to localhost:3001
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

// Definimos una clase de error personalizada para manejar errores de la API
class ApiError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch function
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // Attach Content-Type and current user id (if available) to help the backend
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    // Note: authentication now uses HttpOnly cookie session; do not attach x-user-id from client.
    const config: RequestInit = {
        ...options,
    headers,
    // Ensure cookies (HttpOnly session) are sent with requests to the backend
    credentials: 'include',
    };

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
            
            // Lanzamos nuestro error personalizado
            throw new ApiError(errorMessage, response.status, errorData.details);
        }

        if (response.status === 204 || responseBody.length === 0) {
            return null;
        }

        return JSON.parse(responseBody);

    } catch (error) {
        // Si el error ya es una instancia de ApiError, significa que ya lo hemos procesado.
        // Lo volvemos a lanzar para que el componente que llama lo maneje.
        if (error instanceof ApiError) {
            // No mostramos un toast aquí para evitar duplicados. El componente decidirá.
            throw error;
        }

        // Si no es un ApiError, probablemente sea un error de red.
        const message = error instanceof Error ? error.message : 'Ocurrió un error de red o de conexión.';
        console.error(`--- Network or Parsing Error ---
        URL: ${url}
        Error: ${message}
        --------------------------------`);
        toastError("Error de Conexión", message);
        throw error; // Lo lanzamos para que la lógica de la aplicación pueda reaccionar.
    }
}

// Auth helpers
export const login = (username: string, password: string) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
});

export const logout = () => fetchAPI('/auth/logout', { method: 'POST' });

export const getCurrentUser = () => fetchAPI('/auth/me');


// Product API calls
export const getProducts = (): Promise<Product[]> => fetchAPI('/products');
export const getProductMovements = (variantId: number): Promise<InventoryMovement[]> => fetchAPI(`/variants/${variantId}/movements`);

export const createProduct = (productData: Partial<Product>): Promise<Product> => {
    return fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
    });
};

export const updateProduct = (id: number, productData: Partial<Product>): Promise<{ message: string }> => {
    return fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
    });
};

export const deleteProduct = (id: number): Promise<null> => {
    return fetchAPI(`/products/${id}`, {
        method: 'DELETE',
    });
};

// Brand API calls
export const getBrands = (params?: { subdepartmentId?: number | string; includeGlobal?: boolean }): Promise<{ id: number; name: string }[]> => {
    const q = params ? new URLSearchParams() : null;
    if (params?.subdepartmentId) q?.set('subdepartmentId', String(params.subdepartmentId));
    if (params?.includeGlobal) q?.set('includeGlobal', 'true');
    const endpoint = q && q.toString() ? `/brands?${q.toString()}` : '/brands';
    return fetchAPI(endpoint);
};

export const createBrand = (name: string, subdepartmentId?: number | null): Promise<{ id: number; name: string }> => {
    return fetchAPI('/brands', {
        method: 'POST',
        body: JSON.stringify({ name, subdepartmentId: subdepartmentId || null }),
    });
};

export const updateBrand = (id: number, name: string): Promise<{ message: string }> => {
    return fetchAPI(`/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    });
};

export const deleteBrand = (id: number): Promise<null> => {
    return fetchAPI(`/brands/${id}`, {
        method: 'DELETE',
    });
};

// Attribute API calls
export const getAttributes = (params?: { subdepartmentId?: number | string; includeGlobal?: boolean }): Promise<{ id: number; name: string; subdepartmentId?: number | null }[]> => {
    const q = params ? new URLSearchParams() : null;
    if (params?.subdepartmentId) q?.set('subdepartmentId', String(params.subdepartmentId));
    if (params?.includeGlobal) q?.set('includeGlobal', 'true');
    const endpoint = q && q.toString() ? `/attributes?${q.toString()}` : '/attributes';
    return fetchAPI(endpoint);
};

export const createAttribute = (name: string, subdepartmentId?: number | null): Promise<{ id: number; name: string }> => {
    return fetchAPI('/attributes', {
        method: 'POST',
        body: JSON.stringify({ name, subdepartmentId: subdepartmentId || null }),
    });
};

export const updateAttribute = (id: number, name: string, subdepartmentId?: number | null): Promise<{ message: string }> => {
    return fetchAPI(`/attributes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, subdepartmentId: subdepartmentId || null }),
    });
};

export const deleteAttribute = (id: number): Promise<null> => {
    return fetchAPI(`/attributes/${id}`, {
        method: 'DELETE',
    });
};

// Attribute Value API calls
export const getAttributeValues = (attributeId: number): Promise<{ id: number; value: string; attribute_id: number }[]> => {
    return fetchAPI(`/attributes/${attributeId}/values`);
};

export const createAttributeValue = (attributeId: number, value: string): Promise<{ id: number; value: string; attribute_id: number }> => {
    return fetchAPI(`/attributes/${attributeId}/values`, {
        method: 'POST',
        body: JSON.stringify({ value }),
    });
};

export const updateAttributeValue = (attributeId: number, valueId: number, value: string): Promise<{ message: string }> => {
    return fetchAPI(`/attributes/${attributeId}/values/${valueId}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
    });
};

export const deleteAttributeValue = (attributeId: number, valueId: number): Promise<null> => {
    return fetchAPI(`/attributes/${attributeId}/values/${valueId}`, {
        method: 'DELETE',
    });
};

// Department & Subdepartment API calls
export const getDepartments = (): Promise<{ id: number; name: string; abbreviation: string }[]> => fetchAPI('/departments');

export const createDepartment = (data: { name: string; abbreviation: string }): Promise<{ id: number; name: string; abbreviation: string }> => {
    return fetchAPI('/departments', { method: 'POST', body: JSON.stringify(data) });
};

export const updateDepartment = (id: number, data: { name: string; abbreviation: string }): Promise<{ message: string }> => {
    return fetchAPI(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteDepartment = (id: number): Promise<null> => {
    return fetchAPI(`/departments/${id}`, { method: 'DELETE' });
};

export const getSubdepartments = (departmentId?: number): Promise<{ id: number; name: string; abbreviation: string; department_id: number; department_name: string }[]> => {
    const endpoint = departmentId ? `/subdepartments?departmentId=${departmentId}` : '/subdepartments';
    return fetchAPI(endpoint);
};

export const createSubdepartment = (data: { name: string; abbreviation: string; department_id: number }): Promise<{ id: number; name: string; abbreviation: string }> => {
    return fetchAPI('/subdepartments', { method: 'POST', body: JSON.stringify(data) });
};

export const updateSubdepartment = (id: number, data: { name: string; abbreviation: string; department_id: number }): Promise<{ message: string }> => {
    return fetchAPI(`/subdepartments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteSubdepartment = (id: number): Promise<null> => {
    return fetchAPI(`/subdepartments/${id}`, { method: 'DELETE' });
};

// SKU Generation API
// Preview next SKU (no reserva)
export const getNextSku = (depId: number, subId: number): Promise<{ nextSku: string }> => {
    return fetchAPI(`/sku/preview?depId=${depId}&subId=${subId}`);
};

// Movements by variant (compatibility)
export const getVariantMovements = (variantId: number): Promise<InventoryMovement[]> => {
    return fetchAPI(`/variants/${variantId}/movements`);
};



// Purchase API call
export const createPurchase = (purchase: PurchasePayload): Promise<{ message: string }> => {
    // El payload ya viene estructurado correctamente desde el frontend.
    // Simplemente lo pasamos al backend.
    return fetchAPI('/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase),
    });
};

export const getPurchaseHistory = (): Promise<GroupedPurchase[]> => fetchAPI('/purchases');

export const updatePurchase = (payload: { transaction_id: string, purchaseData: PurchasePayload }): Promise<{ message: string }> => {
    return fetchAPI('/purchases', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};

export const annulPurchase = (transactionId: string): Promise<{ message: string }> => {
    return fetchAPI(`/purchases/${transactionId}`, {
        method: 'DELETE',
    });
};

export const getPurchaseDetails = (transactionId: string): Promise<PurchasePayload> => {
    return fetchAPI(`/purchases/details?id=${encodeURIComponent(transactionId)}`);
};

// Sale API calls
export const getSalesHistory = (): Promise<GroupedSale[]> => fetchAPI('/sales');

export const getSaleDetails = (transactionId: string): Promise<SalePayload> => {
    return fetchAPI(`/sales/details?id=${encodeURIComponent(transactionId)}`);
};

export const createSale = (sale: SalePayload): Promise<{ message: string }> => {
    return fetchAPI('/sales', {
        method: 'POST',
        body: JSON.stringify(sale),
    });
};

export const updateSale = (payload: { transaction_id: string, saleData: SalePayload }): Promise<{ message:string }> => {
    return fetchAPI('/sales', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};

export const annulSale = (transactionId: string): Promise<{ message: string }> => {
    return fetchAPI(`/sales/${transactionId}`, {
        method: 'DELETE',
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

export const getLatestSnapshot = (): Promise<{ last_date: string | null }> => {
    return fetchAPI('/inventory/latest-snapshot');
};

export const createInventorySnapshot = (snapshot_date: string): Promise<{ message: string, snapshot: { date: string, productCount: number, totalValue: number } }> => {
    return fetchAPI('/inventory/create-snapshot', {
        method: 'POST',
        body: JSON.stringify({ snapshot_date }),
    });
};

// Reports API calls
export const getReports = (): Promise<ReportMetadata[]> => fetchAPI('/reports');

export const getHistoricalSummary = (date: string): Promise<{ date: string, totalProductCount: number, totalStock: number, totalValue: number }> => {
    return fetchAPI('/reports/historical-summary', {
        method: 'POST',
        body: JSON.stringify({ date }),
    });
};

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

// Store Management API calls
export const getStores = (): Promise<{ stores: any[], activeStoreId: string }> => fetchAPI('/stores');
export const createStore = (name: string): Promise<any> => fetchAPI('/stores', { method: 'POST', body: JSON.stringify({ name }) });
export const setActiveStore = (storeId: string): Promise<{ message: string }> => fetchAPI('/stores/active', { method: 'POST', body: JSON.stringify({ storeId }) });
export const getStoreDetails = (storeId: string): Promise<any> => fetchAPI(`/stores/${storeId}/details`);
export const updateStoreDetails = (storeId: string, details: any): Promise<{ message: string }> => fetchAPI(`/stores/${storeId}/details`, { method: 'PUT', body: JSON.stringify(details) });
export const deleteStore = (storeId: string): Promise<{ message: string }> => fetchAPI(`/stores/${storeId}`, { method: 'DELETE' });
export const quitApplication = (): Promise<void> => fetchAPI('/app/quit', { method: 'POST' });

// Pending Transactions API calls
export const getPendingTransactions = (): Promise<{ sales: any[], purchases: any[] }> => fetchAPI('/pending-transactions');

export const addPendingTransaction = (type: 'sale' | 'purchase', payload: any): Promise<any> => {
    return fetchAPI('/pending-transactions', {
        method: 'POST',
        body: JSON.stringify({ type, payload }),
    });
};

export const removePendingTransaction = (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/pending-transactions/${id}`, {
        method: 'DELETE',
    });
};

// Users & Roles API
export const getUsers = (): Promise<{ users: any[]; roles: any[] }> => fetchAPI('/users');
export const getUser = (id: string): Promise<any> => fetchAPI(`/users/${id}`);
export const createUser = (payload: { username: string; displayName?: string; roleId?: string; permissions?: string[]; password?: string }) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(payload) });
export const updateUser = (id: string, payload: { username?: string; displayName?: string; roleId?: string; permissions?: string[]; password?: string }) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteUser = (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' });
export const getUserPermissions = (id: string) => fetchAPI(`/users/${id}/permissions`);
export const updateUserPermissions = (id: string, permissions: string[]) => fetchAPI(`/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) });

