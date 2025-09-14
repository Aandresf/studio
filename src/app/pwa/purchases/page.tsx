"use client";

import React, { useEffect, useState } from 'react';
import { getPurchaseHistory, getPurchaseHistoryPwa } from '@/lib/api';
import { setPurchasesCache, getPurchasesCache } from '@/lib/pwa-idb';
import Link from 'next/link';
import { PurchaseReceiptDialog } from '@/components/dialogs/PurchaseReceiptDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PwaSearch from '@/components/PwaSearch';

export default function PwaPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const key = 'pwa:purchases:cache';
  const load = async () => {
      setLoading(true);
    try {
    const data = await getPurchaseHistoryPwa();
    if (!mounted) return;
    // tolerate different shapes
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (data && Array.isArray((data as any).data)) items = (data as any).data;
    else if (data && Array.isArray((data as any).rows)) items = (data as any).rows;
    else if (data && Array.isArray((data as any).purchases)) items = (data as any).purchases;
    else if (data) items = [data];
    setPurchases(items || []);
    try { await setPurchasesCache(items || []); } catch (e) { try { localStorage.setItem(key, JSON.stringify(items || [])); } catch (e) { /* ignore */ } }
      } catch (err) {
        // fallback to IDB then localStorage
        try {
          const cached = await getPurchasesCache();
          if (cached) setPurchases(cached);
          else {
            const raw = localStorage.getItem(key);
            if (raw) setPurchases(JSON.parse(raw));
          }
        } catch (e) {
          try { const raw = localStorage.getItem(key); if (raw) setPurchases(JSON.parse(raw)); } catch (e) { /* ignore */ }
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
          <h2 className="text-xl font-semibold">Compras (PWA)</h2>
          <span className="inline-flex items-center bg-muted text-sm px-2 py-1 rounded text-muted-foreground">{purchases.length}</span>
        </div>
        <Link href="/pwa" className="text-sm text-muted-foreground">Volver</Link>
      </header>

  <PwaSearch value={query} onChange={setQuery} placeholder="Buscar por ID, proveedor o nota" />

      {loading ? (
        <p>Cargando historial de compras...</p>
      ) : (
        <ul className="space-y-2">
          {purchases.length === 0 && <li className="text-sm text-muted-foreground">No hay compras registradas.</li>}
      {purchases
            .filter((p) => {
              if (!query || query.trim().length === 0) return true;
              const q = query.toLowerCase();
              const id = String(p.transaction_id || p.purchase_id || p.id || '').toLowerCase();
              const provider = String(p.entity_name || p.supplier_name || p.provider || '').toLowerCase();
              const note = String(p.note || p.description || '').toLowerCase();
              return id.includes(q) || provider.includes(q) || note.includes(q);
            })
            .map((p: any) => (
              <li key={p.transaction_id || p.purchase_id || p.id || JSON.stringify(p)} className="p-2 border rounded-md" onClick={() => { const id = p.transaction_id || p.purchase_id || p.id; if (id) { setSelectedTransactionId(id); setIsReceiptOpen(true); } }}>
        <div className="font-medium">{p.entity_name || p.supplier_name || p.provider || 'Compra'}</div>
        <div className="text-xs text-muted-foreground">Fecha: {p.transaction_date ? format(new Date(p.transaction_date), 'yyyy-MM-dd') : (p.purchase_date ? format(new Date(p.purchase_date), 'yyyy-MM-dd') : (p.date ? format(new Date(p.date), 'yyyy-MM-dd') : '-'))}</div>
              </li>
            ))}
        </ul>
      )}
  <PurchaseReceiptDialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen} transactionId={selectedTransactionId} />
    </div>
  );
}
