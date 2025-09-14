
import { toastError } from "@/hooks/use-toast";
import { Product, DashboardSummary, RecentSale, InventoryMovement, ReportMetadata, FullReport, ReportType, StoreSettings, PurchasePayload, SalePayload, GroupedPurchase, GroupedSale } from './types';

// Determine API base at runtime:
// 1) use NEXT_PUBLIC_API_URL if provided (recommended),
// 2) else, if running in browser, assume backend runs on same host at port 3001 (http://<host>:3001),
// 3) otherwise fall back to http://localhost:3001
function getApiBase() {
    const env = process.env.NEXT_PUBLIC_API_URL;
    if (env && env.length) return env.replace(/\/$/, '') + '/api';
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        // assume backend on same host at port 3001
        return `http://${window.location.hostname}:3001/api`;
    }
    return 'http://localhost:3001/api';
}

// Mutable API base value (can be updated at runtime by the app)
let API_BASE_URL = getApiBase();
let AUTH_TOKEN: string | null = null;

export function setAuthToken(token: string | null) {
    AUTH_TOKEN = token;
}

// Allow runtime override (accepts either a base like 'http://host:3001' or 'http://host:3001/api')
export function setApiBase(newBase: string) {
    if (!newBase) return;
    let b = newBase.replace(/\/$/, '');
    if (!b.endsWith('/api')) b = b + '/api';
    API_BASE_URL = b;
    // also store for subsequent loads
    try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('LAST_API_BASE', b); } catch (e) { /* ignore */ }
}

export function getApiBaseCurrent() {
    return API_BASE_URL;
}

// Definimos una clase de error personalizada para manejar errores de la API
class ApiError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch function
async function fetchAPI(endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Extract responseType from options so it doesn't get forwarded to fetch
    const { responseType = 'json', ...reqOptions } = options as any;

    // Attach Content-Type and any provided headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...reqOptions.headers as Record<string, string>,
    };

    // If running in browser and path contains /pwa, mark requests as coming from PWA
    try {
        if (typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.startsWith('/pwa')) {
            headers['x-pwa'] = '1';
        }
    } catch (e) { /* ignore */ }

    // Note: authentication now uses HttpOnly cookie session; do not attach x-user-id from client.
    const config: RequestInit = {
        ...reqOptions,
        headers,
        // Ensure cookies (HttpOnly session) are sent with requests to the backend
        credentials: 'include',
    };

    // If we have an explicit AUTH_TOKEN (from login) add Authorization header as fallback
    if (AUTH_TOKEN) {
        (config.headers as Record<string,string>)['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const responseText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { error: 'El servidor respondió con un error inesperado.', details: responseText };
            }
            const errorMessage = errorData.error || `Error HTTP: ${response.status}`;
            // Lanzamos nuestro error personalizado
            throw new ApiError(errorMessage, response.status, errorData.details);
        }

        if (response.status === 204) {
            return null;
        }

        if (responseType === 'blob') {
            return response.blob();
        }

        const responseBody = await response.text();
        if (!responseBody || responseBody.length === 0) return null;
        return JSON.parse(responseBody);

    } catch (error) {
        if (error instanceof ApiError) throw error;
        const message = error instanceof Error ? error.message : 'Ocurrió un error de red o de conexión.';
        console.error(`--- Network or Parsing Error ---\n        URL: ${url}\n        Error: ${message}\n        --------------------------------`);
        toastError("Error de Conexión", message);
        throw error;
    }
}

// Export fetchAPI for backwards compatibility with older modules.
export { fetchAPI };

// Auth helpers
export const login = async (username: string, password: string) => {
    const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    if (res && (res as any).token) {
        setAuthToken((res as any).token);
    }
    return res;
};

export const logout = () => fetchAPI('/auth/logout', { method: 'POST' });

export const getCurrentUser = () => fetchAPI('/auth/me');


// Product API calls
export const getProducts = (): Promise<Product[]> => fetchAPI('/products');
export const getProductMovements = (variantId: number): Promise<InventoryMovement[]> => fetchAPI(`/variants/${variantId}/movements`);

// Ensure PWA list calls are marked (fallback for direct usage)
export const getProductsPwa = (): Promise<Product[]> => fetchAPI('/products', { headers: { 'x-pwa': '1' } });

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

export const getSalesHistoryPwa = (): Promise<GroupedSale[]> => fetchAPI('/sales', { headers: { 'x-pwa': '1' } });

export const getPurchaseHistoryPwa = (): Promise<GroupedPurchase[]> => fetchAPI('/purchases', { headers: { 'x-pwa': '1' } });

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

// Customers API
export const getCustomers = (q?: string): Promise<any[]> => {
    const endpoint = q ? `/customers?q=${encodeURIComponent(q)}` : '/customers';
    console.log('[frontend api] getCustomers -> requesting', endpoint);
    return fetchAPI(endpoint).then((res) => { console.log('[frontend api] getCustomers -> response shape:', Array.isArray(res) ? `array(${res.length})` : typeof res); return res; });
};

export const getCustomer = (id: string | number) => {
    const endpoint = `/customers/${id}`;
    console.log('[frontend api] getCustomer -> requesting', endpoint);
    return fetchAPI(endpoint).then((res) => { console.log('[frontend api] getCustomer -> response:', res); return res; });
};

export const createCustomer = (payload: any) => fetchAPI('/customers', { method: 'POST', body: JSON.stringify(payload) });

export const updateCustomer = (id: string | number, payload: any) => fetchAPI(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteCustomer = (id: string | number) => fetchAPI(`/customers/${id}`, { method: 'DELETE' });

export const getCustomerHistory = (id: string | number) => {
    const endpoint = `/customers/${id}/history`;
    console.log('[frontend api] getCustomerHistory -> requesting', endpoint);
    return fetchAPI(endpoint).then((res) => { console.log('[frontend api] getCustomerHistory -> response shape:', Array.isArray(res)?`array(${res.length})`:typeof res); return res; });
};

// Suppliers API
export const getSuppliers = (q?: string): Promise<any[]> => {
    const endpoint = q ? `/suppliers?q=${encodeURIComponent(q)}` : '/suppliers';
    console.log('[frontend api] getSuppliers -> requesting', endpoint);
    return fetchAPI(endpoint).then((res) => { console.log('[frontend api] getSuppliers -> response shape:', Array.isArray(res)?`array(${res.length})`:typeof res); return res; });
};

export const getSupplier = (id: string | number) => {
    const endpoint = `/suppliers/${id}`;
    console.log('[frontend api] getSupplier -> requesting', endpoint);
    return fetchAPI(endpoint).then((res) => { console.log('[frontend api] getSupplier -> response:', res); return res; });
};

export const createSupplier = (payload: any) => fetchAPI('/suppliers', { method: 'POST', body: JSON.stringify(payload) });

export const updateSupplier = (id: string | number, payload: any) => fetchAPI(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteSupplier = (id: string | number) => fetchAPI(`/suppliers/${id}`, { method: 'DELETE' });

export const getSupplierHistory = (id: string | number) => {
    const endpoint = `/suppliers/${id}/history`;
    console.log('[frontend api] getSupplierHistory -> requesting', endpoint);
    return fetchAPI(endpoint).then((res) => { console.log('[frontend api] getSupplierHistory -> response shape:', Array.isArray(res)?`array(${res.length})`:typeof res); return res; });
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

export const createReport = (type: ReportType, startDate: string, endDate: string, filters?: Record<string, any>): Promise<FullReport> => {
    return fetchAPI(`/reports/${type.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, filters: filters || {} }),
    });
};

export const previewReport = (type: string, startDate: string, endDate: string, options?: { mode?: MovementExportMode; groupBy?: string; filters?: Record<string, any> }) => {
    const body: any = { type, startDate, endDate };
    if (options?.mode) body.mode = options.mode;
    if (options?.groupBy) body.groupBy = options.groupBy;
    if (options?.filters) body.filters = options.filters;
    return fetchAPI('/reports/preview', { method: 'POST', body: JSON.stringify(body) });
};

export type InventoryExportMode = 'summary' | 'detailed';

export const exportInventoryToExcel = async (startDate: string, endDate: string, mode: InventoryExportMode = 'summary', filters?: Record<string, any>): Promise<void> => {
    try {
        // Usamos fetchAPI para mantener consistencia y enviar cookies de sesión
        const payload = { startDate, endDate, mode, filters: filters || {} };
        const blob: Blob = await fetchAPI('/reports/inventory-excel', {
            method: 'POST',
            body: JSON.stringify(payload),
            responseType: 'blob',
            headers: { 'Content-Type': 'application/json' },
        }) as Blob;

        // Nota: fetchAPI con responseType blob ya lanzó en caso de error.
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;

        // Intentar obtener filename desde cabeceras no es posible aquí porque fetchAPI devuelve el blob.
        // Para conservar compatibilidad, pedimos al backend que ponga el nombre en una cabecera "x-filename" opcional.
        // Si no existe, usamos el nombre por defecto.
        let filename = `reporte-inventario-${startDate}-a-${endDate}.xlsx`;
        try {
            // Intentamos otra petición HEAD para leer headers si el servidor soporta HEAD
            const headResp = await fetch(`${API_BASE_URL}/reports/inventory-excel`, {
                method: 'HEAD',
                credentials: 'include',
            });
            const xf = headResp.headers.get('x-filename') || headResp.headers.get('content-disposition');
            if (xf) {
                // si es content-disposition, extraer nombre
                if (xf.indexOf('filename') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(xf);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                } else {
                    filename = xf;
                }
            }
        } catch (e) {
            // Silencioso: si HEAD falla, seguimos con el nombre por defecto.
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        // fetchAPI ya mostró un toast de conexión cuando corresponde.
        if (error instanceof ApiError) {
            toastError('Error de Exportación', error.message);
        } else {
            const message = error instanceof Error ? error.message : 'Ocurrió un error de exportación.';
            toastError('Error de Exportación', message);
        }
        throw error;
    }
};

// Export inventory 'as of' a specific date (snapshot-like export)
export const exportInventoryAsOf = async (date: string, mode: InventoryExportMode = 'summary', filters?: Record<string, any>): Promise<void> => {
    try {
        const payload: any = { date, mode, filters: filters || {} };
        const blob: Blob = await fetchAPI('/reports/inventory-as-of', {
            method: 'POST',
            body: JSON.stringify(payload),
            responseType: 'blob',
            headers: { 'Content-Type': 'application/json' },
        }) as Blob;

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `reporte-inventario-as-of-${date}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        if (error instanceof ApiError) toastError('Error de Exportación', error.message);
        throw error;
    }
};

export type MovementExportMode = 'detailed' | 'summary';
export const exportSalesToExcel = async (startDate: string, endDate: string, mode: MovementExportMode = 'detailed', groupBy?: string, filters?: Record<string, any>): Promise<void> => {
    try {
        const payload: any = { startDate, endDate, filters: filters || {}, mode };
        if (groupBy) payload.groupBy = groupBy;
        const blob: Blob = await fetchAPI('/reports/sales-excel', { method: 'POST', body: JSON.stringify(payload), responseType: 'blob', headers: { 'Content-Type': 'application/json' } }) as Blob;
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = downloadUrl; a.download = `reporte-ventas-${startDate}-a-${endDate}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        if (error instanceof ApiError) toastError('Error de Exportación', error.message);
        throw error;
    }
};

export const exportPurchasesToExcel = async (startDate: string, endDate: string, mode: MovementExportMode = 'detailed', groupBy?: string, filters?: Record<string, any>): Promise<void> => {
    try {
        const payload: any = { startDate, endDate, filters: filters || {}, mode };
        if (groupBy) payload.groupBy = groupBy;
        const blob: Blob = await fetchAPI('/reports/purchases-excel', { method: 'POST', body: JSON.stringify(payload), responseType: 'blob', headers: { 'Content-Type': 'application/json' } }) as Blob;
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = downloadUrl; a.download = `reporte-compras-${startDate}-a-${endDate}.xlsx`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        if (error instanceof ApiError) toastError('Error de Exportación', error.message);
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

