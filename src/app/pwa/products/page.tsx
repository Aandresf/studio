"use client";

import React, { useEffect, useState } from 'react';
import { getProducts, getProductsPwa } from '@/lib/api';
import { ProductDetailDialog } from '@/components/dialogs/ProductDetailDialog';
import { setProductsCache, getProductsCache } from '@/lib/pwa-idb';
import Link from 'next/link';
import PwaSearch from '@/components/PwaSearch';

export default function PwaProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const key = 'pwa:products:cache';
  const load = async () => {
      setLoading(true);
      try {
  const data = await getProductsPwa();
    if (!mounted) return;
    // tolerate different shapes returned by backend
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (data && Array.isArray((data as any).data)) items = (data as any).data;
    else if (data && Array.isArray((data as any).rows)) items = (data as any).rows;
    else if (data && Array.isArray((data as any).products)) items = (data as any).products;
    else if (data) items = [data];
  setProducts(items || []);
  try { await setProductsCache(items || []); } catch (e) { try { localStorage.setItem(key, JSON.stringify(items || [])); } catch (e) { /* ignore */ } }
  if ((!items || items.length === 0) && data) console.debug('[pwa] getProducts returned unexpected shape or empty array:', data);
      } catch (err) {
        // fallback to IDB then localStorage
        try {
          const cached = await getProductsCache();
          if (cached) setProducts(cached);
          else {
            const raw = localStorage.getItem(key);
            if (raw) setProducts(JSON.parse(raw));
          }
        } catch (e) {
          try { const raw = localStorage.getItem(key); if (raw) setProducts(JSON.parse(raw)); } catch (e) { /* ignore */ }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Productos (PWA)</h2>
          <span className="inline-flex items-center bg-muted text-sm px-2 py-1 rounded text-muted-foreground">{products.length}</span>
        </div>
        <Link href="/pwa" className="text-sm text-muted-foreground">Volver</Link>
      </header>

  <PwaSearch value={query} onChange={setQuery} placeholder="Buscar por nombre, SKU o atributo" />

      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2">
          <button onClick={() => setStockFilter('all')} className={`px-3 py-1 rounded ${stockFilter==='all' ? 'bg-sky-500 text-white' : 'border'}`}>Todos</button>
          <button onClick={() => setStockFilter('in')} className={`px-3 py-1 rounded ${stockFilter==='in' ? 'bg-emerald-500 text-white' : 'border'}`}>Con stock</button>
          <button onClick={() => setStockFilter('out')} className={`px-3 py-1 rounded ${stockFilter==='out' ? 'bg-rose-500 text-white' : 'border'}`}>Sin stock</button>
        </div>
        <div className="ml-auto">
          <button onClick={() => { setQuery(''); setStockFilter('all'); }} className="px-3 py-1 border rounded">Limpiar</button>
        </div>
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ul className="space-y-2">
          {products.length === 0 && <li className="text-sm text-muted-foreground">No hay productos disponibles.</li>}
          {products
            .filter((p) => {
              // stock filter
              if (stockFilter === 'in') {
                // if product has variants, check sum of variant current_stock
                if (Array.isArray(p.variants) && p.variants.length > 0) {
                  const sum = p.variants.reduce((s: number, v: any) => s + Number(v.current_stock || 0), 0);
                  if (!(sum > 0)) return false;
                } else {
                  const qty = Number(p.stock || p.quantity || p.on_hand || p.current_stock || 0);
                  if (!(qty > 0)) return false;
                }
              } else if (stockFilter === 'out') {
                if (Array.isArray(p.variants) && p.variants.length > 0) {
                  const sum = p.variants.reduce((s: number, v: any) => s + Number(v.current_stock || 0), 0);
                  if (!(sum === 0)) return false;
                } else {
                  const qty = Number(p.stock || p.quantity || p.on_hand || p.current_stock || 0);
                  if (!(qty === 0)) return false;
                }
              }
              // query filter
              if (!query || query.trim().length === 0) return true;
              const q = query.toLowerCase();
              const name = String(p.name || p.displayName || '').toLowerCase();
              const sku = String(p.base_sku || p.sku || '').toLowerCase();
              const attrs = (p.attributes || []).map((a: any) => String(a.name || a).toLowerCase()).join(' ');
              // also search variant SKUs
              const variantSkus = (p.variants || []).map((v: any) => String(v.sku || '').toLowerCase()).join(' ');
              return name.includes(q) || sku.includes(q) || attrs.includes(q) || variantSkus.includes(q);
            })
            .map((p: any) => (
              <li key={p.id || p.base_sku || p.sku || JSON.stringify(p)} className="p-3 border rounded-md bg-card text-card-foreground cursor-pointer hover:shadow" onClick={() => { setSelectedProduct(p); setProductDialogOpen(true); }}>
                <div className="font-medium text-foreground">{p.name || p.displayName || p.base_sku || p.sku}</div>
                <div className="text-xs text-muted-foreground">SKU: {p.base_sku || p.sku || '-'}</div>
              </li>
            ))}
        </ul>
      )}
    <ProductDetailDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} product={selectedProduct} />
    </div>
  );
}

