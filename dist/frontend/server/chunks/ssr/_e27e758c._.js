module.exports = {

"[project]/src/lib/api.ts [app-ssr] (ecmascript, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
    });
});
}}),
"[project]/node_modules/qrcode/lib/index.js [app-ssr] (ecmascript, async loader)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/node_modules_60243985._.js",
  "server/chunks/ssr/[root-of-the-server]__eeb7b8ef._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/qrcode/lib/index.js [app-ssr] (ecmascript)");
    });
});
}}),

};