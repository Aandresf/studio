"use client";

import React, { useEffect, useState } from 'react';
import { getSalesHistory, getSalesHistoryPwa } from '@/lib/api';
import { setSalesCache, getSalesCache } from '@/lib/pwa-idb';
import Link from 'next/link';
import { SalesReceiptDialog } from '@/components/dialogs/SalesReceiptDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PwaSearch from '@/components/PwaSearch';

export default function PwaSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const key = 'pwa:sales:cache';
    const load = async () => {
      setLoading(true);
    try {
  const data = await getSalesHistoryPwa();
  if (!mounted) return;
  let items: any[] = [];
  if (Array.isArray(data)) items = data;
  else if (data && Array.isArray((data as any).data)) items = (data as any).data;
  else if (data && Array.isArray((data as any).rows)) items = (data as any).rows;
  else if (data && Array.isArray((data as any).sales)) items = (data as any).sales;
  else if (data) items = [data];
  setSales(items || []);
  try { await setSalesCache(items || []); } catch (e) { try { localStorage.setItem(key, JSON.stringify(items || [])); } catch (e) { /* ignore */ } }
  if ((!items || items.length === 0) && data) console.debug('[pwa] getSalesHistory returned unexpected shape or empty array:', data);
      } catch (err) {
        // fallback to IDB then localStorage
        try {
          const cached = await getSalesCache();
          if (cached) setSales(cached);
          else {
            const raw = localStorage.getItem(key);
            if (raw) setSales(JSON.parse(raw));
          }
        } catch (e) {
          try { const raw = localStorage.getItem(key); if (raw) setSales(JSON.parse(raw)); } catch (e) { /* ignore */ }
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
          <h2 className="text-xl font-semibold">Ventas (PWA)</h2>
          <span className="inline-flex items-center bg-muted text-sm px-2 py-1 rounded text-muted-foreground">{sales.length}</span>
        </div>
        <Link href="/pwa" className="text-sm text-muted-foreground">Volver</Link>
      </header>

  <PwaSearch value={query} onChange={setQuery} placeholder="Buscar por ID, cliente o nota" />

      {loading ? (
        <p>Cargando historial de ventas...</p>
      ) : (
        <ul className="space-y-2">
          {sales.length === 0 && <li className="text-sm text-muted-foreground">No hay ventas registradas.</li>}
          {sales
            .filter((s) => {
              if (!query || query.trim().length === 0) return true;
              const q = query.toLowerCase();
              const id = String(s.transaction_id || s.id || '').toLowerCase();
              const name = String(s.entity_name || s.customer_name || '').toLowerCase();
              const note = String(s.note || s.description || '').toLowerCase();
              return id.includes(q) || name.includes(q) || note.includes(q);
            })
            .map((s: any) => (
              <li key={s.transaction_id || s.id || JSON.stringify(s)} className="p-2 border rounded-md" onClick={() => { const id = s.transaction_id || s.id; if (id) { setSelectedTransactionId(id); setIsReceiptOpen(true); } }}>
                <div className="font-medium">{s.entity_name || s.customer_name || 'Venta'}</div>
                <div className="text-xs text-muted-foreground">Fecha: {s.transaction_date ? format(new Date(s.transaction_date), 'yyyy-MM-dd') : (s.date ? format(new Date(s.date), 'yyyy-MM-dd') : '-')}</div>
              </li>
            ))}
        </ul>
      )}
      <SalesReceiptDialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen} transactionId={selectedTransactionId} />
    </div>
  );
}
