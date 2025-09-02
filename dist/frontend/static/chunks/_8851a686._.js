(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/ui/input.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Input": (()=>Input)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, type, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/input.tsx",
        lineNumber: 8,
        columnNumber: 7
    }, this);
});
_c1 = Input;
Input.displayName = "Input";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input$React.forwardRef");
__turbopack_context__.k.register(_c1, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/button.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Button": (()=>Button),
    "buttonVariants": (()=>buttonVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 46,
        columnNumber: 7
    }, this);
});
_c1 = Button;
Button.displayName = "Button";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/api.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "addPendingTransaction": (()=>addPendingTransaction),
    "annulPurchase": (()=>annulPurchase),
    "annulSale": (()=>annulSale),
    "backupDatabase": (()=>backupDatabase),
    "createAttribute": (()=>createAttribute),
    "createAttributeValue": (()=>createAttributeValue),
    "createBrand": (()=>createBrand),
    "createDepartment": (()=>createDepartment),
    "createInventoryMovement": (()=>createInventoryMovement),
    "createInventorySnapshot": (()=>createInventorySnapshot),
    "createProduct": (()=>createProduct),
    "createPurchase": (()=>createPurchase),
    "createReport": (()=>createReport),
    "createSale": (()=>createSale),
    "createStore": (()=>createStore),
    "createSubdepartment": (()=>createSubdepartment),
    "createUser": (()=>createUser),
    "deleteAttribute": (()=>deleteAttribute),
    "deleteAttributeValue": (()=>deleteAttributeValue),
    "deleteBrand": (()=>deleteBrand),
    "deleteDepartment": (()=>deleteDepartment),
    "deleteProduct": (()=>deleteProduct),
    "deleteStore": (()=>deleteStore),
    "deleteSubdepartment": (()=>deleteSubdepartment),
    "deleteUser": (()=>deleteUser),
    "exportInventoryToExcel": (()=>exportInventoryToExcel),
    "getAttributeValues": (()=>getAttributeValues),
    "getAttributes": (()=>getAttributes),
    "getBrands": (()=>getBrands),
    "getCurrentUser": (()=>getCurrentUser),
    "getDashboardSummary": (()=>getDashboardSummary),
    "getDepartments": (()=>getDepartments),
    "getHistoricalSummary": (()=>getHistoricalSummary),
    "getLatestSnapshot": (()=>getLatestSnapshot),
    "getNextSku": (()=>getNextSku),
    "getPendingTransactions": (()=>getPendingTransactions),
    "getProductMovements": (()=>getProductMovements),
    "getProducts": (()=>getProducts),
    "getPurchaseDetails": (()=>getPurchaseDetails),
    "getPurchaseHistory": (()=>getPurchaseHistory),
    "getRecentSales": (()=>getRecentSales),
    "getReportById": (()=>getReportById),
    "getReports": (()=>getReports),
    "getSaleDetails": (()=>getSaleDetails),
    "getSalesHistory": (()=>getSalesHistory),
    "getStoreDetails": (()=>getStoreDetails),
    "getStoreSettings": (()=>getStoreSettings),
    "getStores": (()=>getStores),
    "getSubdepartments": (()=>getSubdepartments),
    "getUser": (()=>getUser),
    "getUserPermissions": (()=>getUserPermissions),
    "getUsers": (()=>getUsers),
    "getVariantMovements": (()=>getVariantMovements),
    "login": (()=>login),
    "logout": (()=>logout),
    "quitApplication": (()=>quitApplication),
    "removePendingTransaction": (()=>removePendingTransaction),
    "setActiveStore": (()=>setActiveStore),
    "updateAttribute": (()=>updateAttribute),
    "updateAttributeValue": (()=>updateAttributeValue),
    "updateBrand": (()=>updateBrand),
    "updateDepartment": (()=>updateDepartment),
    "updateProduct": (()=>updateProduct),
    "updatePurchase": (()=>updatePurchase),
    "updateSale": (()=>updateSale),
    "updateStoreDetails": (()=>updateStoreDetails),
    "updateStoreSettings": (()=>updateStoreSettings),
    "updateSubdepartment": (()=>updateSubdepartment),
    "updateUser": (()=>updateUser),
    "updateUserPermissions": (()=>updateUserPermissions)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.tsx [app-client] (ecmascript)");
;
// Use NEXT_PUBLIC_API_URL at build/runtime if provided, otherwise default to localhost:3001
const API_BASE_URL = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';
// Definimos una clase de error personalizada para manejar errores de la API
class ApiError extends Error {
    status;
    details;
    constructor(message, status, details){
        super(message), this.status = status, this.details = details;
        this.name = 'ApiError';
    }
}
// Generic fetch function
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // Attach Content-Type and current user id (if available) to help the backend
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    // Note: authentication now uses HttpOnly cookie session; do not attach x-user-id from client.
    const config = {
        ...options,
        headers
    };
    try {
        const response = await fetch(url, config);
        const responseBody = await response.text();
        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseBody);
            } catch  {
                errorData = {
                    error: 'El servidor respondió con un error inesperado.',
                    details: responseBody
                };
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastError"])("Error de Conexión", message);
        throw error; // Lo lanzamos para que la lógica de la aplicación pueda reaccionar.
    }
}
const login = (username, password)=>fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password
        })
    });
const logout = ()=>fetchAPI('/auth/logout', {
        method: 'POST'
    });
const getCurrentUser = ()=>fetchAPI('/auth/me');
const getProducts = ()=>fetchAPI('/products');
const getProductMovements = (variantId)=>fetchAPI(`/variants/${variantId}/movements`);
const createProduct = (productData)=>{
    return fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    });
};
const updateProduct = (id, productData)=>{
    return fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
};
const deleteProduct = (id)=>{
    return fetchAPI(`/products/${id}`, {
        method: 'DELETE'
    });
};
const getBrands = ()=>fetchAPI('/brands');
const createBrand = (name)=>{
    return fetchAPI('/brands', {
        method: 'POST',
        body: JSON.stringify({
            name
        })
    });
};
const updateBrand = (id, name)=>{
    return fetchAPI(`/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            name
        })
    });
};
const deleteBrand = (id)=>{
    return fetchAPI(`/brands/${id}`, {
        method: 'DELETE'
    });
};
const getAttributes = ()=>fetchAPI('/attributes');
const createAttribute = (name)=>{
    return fetchAPI('/attributes', {
        method: 'POST',
        body: JSON.stringify({
            name
        })
    });
};
const updateAttribute = (id, name)=>{
    return fetchAPI(`/attributes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            name
        })
    });
};
const deleteAttribute = (id)=>{
    return fetchAPI(`/attributes/${id}`, {
        method: 'DELETE'
    });
};
const getAttributeValues = (attributeId)=>{
    return fetchAPI(`/attributes/${attributeId}/values`);
};
const createAttributeValue = (attributeId, value)=>{
    return fetchAPI(`/attributes/${attributeId}/values`, {
        method: 'POST',
        body: JSON.stringify({
            value
        })
    });
};
const updateAttributeValue = (attributeId, valueId, value)=>{
    return fetchAPI(`/attributes/${attributeId}/values/${valueId}`, {
        method: 'PUT',
        body: JSON.stringify({
            value
        })
    });
};
const deleteAttributeValue = (attributeId, valueId)=>{
    return fetchAPI(`/attributes/${attributeId}/values/${valueId}`, {
        method: 'DELETE'
    });
};
const getDepartments = ()=>fetchAPI('/departments');
const createDepartment = (data)=>{
    return fetchAPI('/departments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};
const updateDepartment = (id, data)=>{
    return fetchAPI(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};
const deleteDepartment = (id)=>{
    return fetchAPI(`/departments/${id}`, {
        method: 'DELETE'
    });
};
const getSubdepartments = (departmentId)=>{
    const endpoint = departmentId ? `/subdepartments?departmentId=${departmentId}` : '/subdepartments';
    return fetchAPI(endpoint);
};
const createSubdepartment = (data)=>{
    return fetchAPI('/subdepartments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};
const updateSubdepartment = (id, data)=>{
    return fetchAPI(`/subdepartments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};
const deleteSubdepartment = (id)=>{
    return fetchAPI(`/subdepartments/${id}`, {
        method: 'DELETE'
    });
};
const getNextSku = (depId, subId)=>{
    return fetchAPI(`/sku/preview?depId=${depId}&subId=${subId}`);
};
const getVariantMovements = (variantId)=>{
    return fetchAPI(`/variants/${variantId}/movements`);
};
const createPurchase = (purchase)=>{
    // El payload ya viene estructurado correctamente desde el frontend.
    // Simplemente lo pasamos al backend.
    return fetchAPI('/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase)
    });
};
const getPurchaseHistory = ()=>fetchAPI('/purchases');
const updatePurchase = (payload)=>{
    return fetchAPI('/purchases', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};
const annulPurchase = (transactionId)=>{
    return fetchAPI(`/purchases/${transactionId}`, {
        method: 'DELETE'
    });
};
const getPurchaseDetails = (transactionId)=>{
    return fetchAPI(`/purchases/details?id=${encodeURIComponent(transactionId)}`);
};
const getSalesHistory = ()=>fetchAPI('/sales');
const getSaleDetails = (transactionId)=>{
    return fetchAPI(`/sales/details?id=${encodeURIComponent(transactionId)}`);
};
const createSale = (sale)=>{
    return fetchAPI('/sales', {
        method: 'POST',
        body: JSON.stringify(sale)
    });
};
const updateSale = (payload)=>{
    return fetchAPI('/sales', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};
const annulSale = (transactionId)=>{
    return fetchAPI(`/sales/${transactionId}`, {
        method: 'DELETE'
    });
};
const getDashboardSummary = ()=>fetchAPI('/dashboard/summary');
const getRecentSales = ()=>fetchAPI('/dashboard/recent-sales');
const createInventoryMovement = (movement)=>{
    return fetchAPI('/inventory/movements', {
        method: 'POST',
        body: JSON.stringify(movement)
    });
};
const getLatestSnapshot = ()=>{
    return fetchAPI('/inventory/latest-snapshot');
};
const createInventorySnapshot = (snapshot_date)=>{
    return fetchAPI('/inventory/create-snapshot', {
        method: 'POST',
        body: JSON.stringify({
            snapshot_date
        })
    });
};
const getReports = ()=>fetchAPI('/reports');
const getHistoricalSummary = (date)=>{
    return fetchAPI('/reports/historical-summary', {
        method: 'POST',
        body: JSON.stringify({
            date
        })
    });
};
const createReport = (type, startDate, endDate)=>{
    return fetchAPI(`/reports/${type.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify({
            startDate,
            endDate
        })
    });
};
const exportInventoryToExcel = async (startDate, endDate)=>{
    const url = `${API_BASE_URL}/reports/inventory-excel`;
    console.log(`--- API Request (Excel Export) ---
    URL: ${url}
    Method: POST
    Body: ${{
        startDate,
        endDate
    }}
    -------------------`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                startDate,
                endDate
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch  {
                errorData = {
                    error: 'El servidor respondió con un error inesperado durante la exportación.',
                    details: errorText
                };
            }
            const errorMessage = errorData.error || `Error HTTP: ${response.status}`;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastError"])("Error de Exportación", errorMessage);
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
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastError"])("Error de Conexión", message);
        }
        throw error;
    }
};
const getReportById = (id)=>fetchAPI(`/reports/${id}`);
const getStoreSettings = ()=>fetchAPI('/settings/store');
const updateStoreSettings = (settings)=>{
    return fetchAPI('/settings/store', {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
};
const backupDatabase = ()=>fetchAPI('/database/backup', {
        method: 'POST'
    });
const getStores = ()=>fetchAPI('/stores');
const createStore = (name)=>fetchAPI('/stores', {
        method: 'POST',
        body: JSON.stringify({
            name
        })
    });
const setActiveStore = (storeId)=>fetchAPI('/stores/active', {
        method: 'POST',
        body: JSON.stringify({
            storeId
        })
    });
const getStoreDetails = (storeId)=>fetchAPI(`/stores/${storeId}/details`);
const updateStoreDetails = (storeId, details)=>fetchAPI(`/stores/${storeId}/details`, {
        method: 'PUT',
        body: JSON.stringify(details)
    });
const deleteStore = (storeId)=>fetchAPI(`/stores/${storeId}`, {
        method: 'DELETE'
    });
const quitApplication = ()=>fetchAPI('/app/quit', {
        method: 'POST'
    });
const getPendingTransactions = ()=>fetchAPI('/pending-transactions');
const addPendingTransaction = (type, payload)=>{
    return fetchAPI('/pending-transactions', {
        method: 'POST',
        body: JSON.stringify({
            type,
            payload
        })
    });
};
const removePendingTransaction = (id)=>{
    return fetchAPI(`/pending-transactions/${id}`, {
        method: 'DELETE'
    });
};
const getUsers = ()=>fetchAPI('/users');
const getUser = (id)=>fetchAPI(`/users/${id}`);
const createUser = (payload)=>fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
const updateUser = (id, payload)=>fetchAPI(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
const deleteUser = (id)=>fetchAPI(`/users/${id}`, {
        method: 'DELETE'
    });
const getUserPermissions = (id)=>fetchAPI(`/users/${id}/permissions`);
const updateUserPermissions = (id, permissions)=>fetchAPI(`/users/${id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
            permissions
        })
    });
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/use-current-user.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "CurrentUserContext": (()=>CurrentUserContext),
    "CurrentUserProvider": (()=>CurrentUserProvider),
    "useCurrentUser": (()=>useCurrentUser),
    "useProvideCurrentUser": (()=>useProvideCurrentUser)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
;
function useProvideCurrentUser() {
    _s();
    const [userId, setUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentUserInfo, setCurrentUserInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [permissions, setPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [roles, setRoles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const loadUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProvideCurrentUser.useCallback[loadUsers]": async ()=>{
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUsers"])();
                setUsers(data?.users || []);
                setRoles(data?.roles || []);
            } catch (e) {
                console.error('Error cargando lista de usuarios', e);
                setUsers([]);
                setRoles([]);
            }
        }
    }["useProvideCurrentUser.useCallback[loadUsers]"], []);
    const loadPermissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProvideCurrentUser.useCallback[loadPermissions]": async (id)=>{
            if (!id) {
                setPermissions([]);
                return;
            }
            setLoading(true);
            try {
                const body = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUserPermissions"])(id);
                setPermissions(body?.permissions || []);
            } catch (e) {
                console.error('Error cargando permisos del usuario', e);
                setPermissions([]);
            } finally{
                setLoading(false);
            }
        }
    }["useProvideCurrentUser.useCallback[loadPermissions]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProvideCurrentUser.useEffect": ()=>{
            loadUsers();
        }
    }["useProvideCurrentUser.useEffect"], [
        loadUsers
    ]);
    // Load current authenticated user from server (via cookie session)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProvideCurrentUser.useEffect": ()=>{
            ({
                "useProvideCurrentUser.useEffect": async ()=>{
                    try {
                        const me = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentUser"])();
                        if (me && me.id) {
                            setUserId(me.id);
                            setCurrentUserInfo(me);
                            setPermissions(me.permissions || []);
                        } else {
                            setUserId(null);
                            setCurrentUserInfo(null);
                            setPermissions([]);
                        }
                    } catch (e) {
                        setUserId(null);
                        setCurrentUserInfo(null);
                        setPermissions([]);
                    }
                }
            })["useProvideCurrentUser.useEffect"]();
        }
    }["useProvideCurrentUser.useEffect"], []);
    // Legacy user selection removed: the authenticated user comes from the server session.
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProvideCurrentUser.useCallback[login]": async (username, password)=>{
            const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["login"])(username, password);
            // After successful login, refresh current user info
            const me = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentUser"])();
            if (me && me.id) {
                setUserId(me.id);
                setCurrentUserInfo(me);
                setPermissions(me.permissions || []);
            }
            return user;
        }
    }["useProvideCurrentUser.useCallback[login]"], []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProvideCurrentUser.useCallback[logout]": async ()=>{
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logout"])();
            setUserId(null);
            setCurrentUserInfo(null);
            setPermissions([]);
            // refresh users list
            try {
                await loadUsers();
            } catch  {}
            ;
        }
    }["useProvideCurrentUser.useCallback[logout]"], []);
    return {
        userId,
        currentUserInfo,
        setCurrentUser,
        login,
        logout,
        permissions,
        users,
        roles,
        loading,
        refresh: ()=>{
            if (userId) loadPermissions(userId);
            loadUsers();
        }
    };
}
_s(useProvideCurrentUser, "PwYEJ0S1VTvuHYv6wpA3sgAEx4U=");
const CurrentUserContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function CurrentUserProvider({ children }) {
    _s1();
    const store = useProvideCurrentUser();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CurrentUserContext.Provider, {
        value: store,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/hooks/use-current-user.tsx",
        lineNumber: 105,
        columnNumber: 10
    }, this);
}
_s1(CurrentUserProvider, "7UoAALfRJ07GIGRW8H7RvFANoWg=", false, function() {
    return [
        useProvideCurrentUser
    ];
});
_c = CurrentUserProvider;
function useCurrentUser() {
    _s2();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(CurrentUserContext);
}
_s2(useCurrentUser, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "CurrentUserProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/login/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>LoginPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$current$2d$user$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-current-user.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function LoginPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$current$2d$user$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCurrentUser"])();
    const [username, setUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setLoading(true);
        try {
            await current.login(username, password);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastSuccess"])('Sesión iniciada', 'Has iniciado sesión correctamente.');
            router.push('/dashboard');
        } catch (err) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastError"])('Error', err?.message || 'No se pudo iniciar sesión');
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-md mx-auto mt-12",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-semibold mb-4",
                children: "Iniciar sesión"
            }, void 0, false, {
                fileName: "[project]/src/app/login/page.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit,
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm mb-1",
                                children: "Usuario"
                            }, void 0, false, {
                                fileName: "[project]/src/app/login/page.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                value: username,
                                onChange: (e)=>setUsername(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/src/app/login/page.tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/login/page.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm mb-1",
                                children: "Contraseña"
                            }, void 0, false, {
                                fileName: "[project]/src/app/login/page.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                type: "password",
                                value: password,
                                onChange: (e)=>setPassword(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/src/app/login/page.tsx",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/login/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            type: "submit",
                            disabled: loading,
                            children: loading ? 'Entrando...' : 'Entrar'
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/login/page.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/login/page.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/login/page.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_s(LoginPage, "hcFbg1xHY4uZGw8zRi1P+I1EVL0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$current$2d$user$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCurrentUser"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}}),
"[project]/node_modules/@radix-ui/react-slot/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// packages/react/compose-refs/src/compose-refs.tsx
__turbopack_context__.s({
    "composeRefs": (()=>composeRefs),
    "useComposedRefs": (()=>useComposedRefs)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
function setRef(ref, value) {
    if (typeof ref === "function") {
        return ref(value);
    } else if (ref !== null && ref !== void 0) {
        ref.current = value;
    }
}
function composeRefs(...refs) {
    return (node)=>{
        let hasCleanup = false;
        const cleanups = refs.map((ref)=>{
            const cleanup = setRef(ref, node);
            if (!hasCleanup && typeof cleanup == "function") {
                hasCleanup = true;
            }
            return cleanup;
        });
        if (hasCleanup) {
            return ()=>{
                for(let i = 0; i < cleanups.length; i++){
                    const cleanup = cleanups[i];
                    if (typeof cleanup == "function") {
                        cleanup();
                    } else {
                        setRef(refs[i], null);
                    }
                }
            };
        }
    };
}
function useComposedRefs(...refs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])(composeRefs(...refs), refs);
}
;
 //# sourceMappingURL=index.mjs.map
}}),
"[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// src/slot.tsx
__turbopack_context__.s({
    "Root": (()=>Slot),
    "Slot": (()=>Slot),
    "Slottable": (()=>Slottable),
    "createSlot": (()=>createSlot),
    "createSlottable": (()=>createSlottable)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
;
;
;
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
    const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
    const Slot2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])((props, forwardedRef)=>{
        const { children, ...slotProps } = props;
        const childrenArray = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].toArray(children);
        const slottable = childrenArray.find(isSlottable);
        if (slottable) {
            const newElement = slottable.props.children;
            const newChildren = childrenArray.map((child)=>{
                if (child === slottable) {
                    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].count(newElement) > 1) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].only(null);
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(newElement) ? newElement.props.children : null;
                } else {
                    return child;
                }
            });
            return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(newElement) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"])(newElement, void 0, newChildren) : null
            });
        }
        return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(SlotClone, {
            ...slotProps,
            ref: forwardedRef,
            children
        });
    });
    Slot2.displayName = `${ownerName}.Slot`;
    return Slot2;
}
var Slot = /* @__PURE__ */ createSlot("Slot");
// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName) {
    const SlotClone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])((props, forwardedRef)=>{
        const { children, ...slotProps } = props;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(children)) {
            const childrenRef = getElementRef(children);
            const props2 = mergeProps(slotProps, children.props);
            if (children.type !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"]) {
                props2.ref = forwardedRef ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["composeRefs"])(forwardedRef, childrenRef) : childrenRef;
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"])(children, props2);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].count(children) > 1 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].only(null) : null;
    });
    SlotClone.displayName = `${ownerName}.SlotClone`;
    return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
// @__NO_SIDE_EFFECTS__
function createSlottable(ownerName) {
    const Slottable2 = ({ children })=>{
        return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children
        });
    };
    Slottable2.displayName = `${ownerName}.Slottable`;
    Slottable2.__radixId = SLOTTABLE_IDENTIFIER;
    return Slottable2;
}
var Slottable = /* @__PURE__ */ createSlottable("Slottable");
function isSlottable(child) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidElement"])(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
    const overrideProps = {
        ...childProps
    };
    for(const propName in childProps){
        const slotPropValue = slotProps[propName];
        const childPropValue = childProps[propName];
        const isHandler = /^on[A-Z]/.test(propName);
        if (isHandler) {
            if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args)=>{
                    const result = childPropValue(...args);
                    slotPropValue(...args);
                    return result;
                };
            } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
            }
        } else if (propName === "style") {
            overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
            };
        } else if (propName === "className") {
            overrideProps[propName] = [
                slotPropValue,
                childPropValue
            ].filter(Boolean).join(" ");
        }
    }
    return {
        ...slotProps,
        ...overrideProps
    };
}
function getElementRef(element) {
    let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
    let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
    if (mayWarn) {
        return element.ref;
    }
    getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
    mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
    if (mayWarn) {
        return element.props.ref;
    }
    return element.props.ref || element.ref;
}
;
 //# sourceMappingURL=index.mjs.map
}}),
}]);

//# sourceMappingURL=_8851a686._.js.map