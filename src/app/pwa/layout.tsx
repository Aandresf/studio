"use client";

import React, { useEffect, useState } from 'react'
import SwMount from './SwMount';
import { clearAllPwaData } from '@/lib/pwa-idb';
import { getProductsPwa, getSalesHistoryPwa, getPurchaseHistoryPwa, getStores } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

// metadata is intentionally handled by the main app; this layout is a client component

async function fetchStoreName(): Promise<string | null> {
  try {
    const res = await getStores();
    if (res && res.stores && Array.isArray(res.stores)) {
      const active = res.stores.find((s: any) => s.id === res.activeStoreId);
      return active ? active.name : (res.stores[0] && res.stores[0].name) || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  const [storeName, setStoreName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'system'|'light'|'dark'>('system');
  const [appliedTheme, setAppliedTheme] = useState<'light'|'dark'>('light');
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const n = await fetchStoreName();
      if (mounted) setStoreName(n);
    })();
    // check backend health for online indicator
    (async () => {
      try {
        const api = await import('@/lib/api');
        const base = (api && api.getApiBaseCurrent) ? api.getApiBaseCurrent() : '';
        const url = base ? `${base.replace(/\/$/, '')}/api/server-info` : '/api/server-info';
        const res = await fetch(url, { credentials: 'include' });
        if (mounted) setOnline(!!res.ok);
      } catch (e) {
        if (mounted) setOnline(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // theme detection + persistence (PWA only)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pwa-theme') : null;
    const initial: 'system'|'light'|'dark' = (saved === 'light' || saved === 'dark' || saved === 'system') ? (saved as any) : 'system';
    setThemeMode(initial);
  }, []);

  // apply theme (listens to system when mode === 'system')
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    const apply = (mode: 'system'|'light'|'dark') => {
      if (mode === 'system') {
        mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        const isDark = mq ? mq.matches : false;
        setAppliedTheme(isDark ? 'dark' : 'light');
      } else {
        setAppliedTheme(mode === 'dark' ? 'dark' : 'light');
      }
    };
    apply(themeMode);
    if (themeMode === 'system' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setAppliedTheme(e.matches ? 'dark' : 'light');
      // addEventListener if available
      try { mq.addEventListener('change', handler); } catch (e) { try { (mq as any).addListener(handler); } catch (e) { /* ignore */ } }
      return () => { try { mq && mq.removeEventListener && mq.removeEventListener('change', handler); } catch (e) { try { mq && (mq as any).removeListener && (mq as any).removeListener(handler); } catch (e) { /* ignore */ } } };
    }
  }, [themeMode]);

  // persist themeMode changes
  useEffect(() => {
    try { localStorage.setItem('pwa-theme', themeMode); } catch (e) { /* ignore */ }
  }, [themeMode]);

  // beforeinstallprompt handling to allow manual install button
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    const appInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    window.addEventListener('appinstalled', appInstalled as EventListener);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
      window.removeEventListener('appinstalled', appInstalled as EventListener);
    };
  }, []);

  const onRefresh = async () => {
    setBusy(true);
    try {
      // clear local idb + localStorage pwa keys
      await clearAllPwaData();
      // refetch primary lists and repopulate caches (fire-and-forget)
      try { const p = await getProductsPwa(); if (p) await (await import('@/lib/pwa-idb')).setProductsCache(p); } catch (e) { /* ignore */ }
      try { const s = await getSalesHistoryPwa(); if (s) await (await import('@/lib/pwa-idb')).setSalesCache(s); } catch (e) { /* ignore */ }
      try { const u = await getPurchaseHistoryPwa(); if (u) await (await import('@/lib/pwa-idb')).setPurchasesCache(u); } catch (e) { /* ignore */ }
      // reload the page so the UI requests fresh data
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <html className={appliedTheme}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-7 h-7 bg-muted rounded flex items-center justify-center">🏬</span>
              <h1 className="text-lg font-semibold">{storeName ? `${storeName} — Inventario` : 'Inventario'}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* online indicator */}
              <div title={online ? 'Conectado' : 'Sin conexión'} className="w-3 h-3 rounded-full" style={{ backgroundColor: online ? '#16a34a' : '#94a3b8' }} />
              {/* Theme selector for PWA */}
              <label className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground">Tema</span>
                <select value={themeMode} onChange={(e) => setThemeMode(e.target.value as any)} className="rounded border border-input bg-background px-2 py-1 text-sm">
                  <option value="system">Automático</option>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </label>

              <button
                onClick={onRefresh}
                className="p-2 bg-primary text-white rounded disabled:opacity-60 inline-flex items-center justify-center"
                disabled={busy}
                aria-label="Refrescar PWA"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              {/* Install button shown when browser fires beforeinstallprompt */}
              {canInstall && (
                <button
                  onClick={async () => {
                    if (!deferredPrompt) return;
                    try {
                      // show the native prompt
                      await deferredPrompt.prompt();
                      const choice = await deferredPrompt.userChoice;
                      // reset state after choice
                      setDeferredPrompt(null);
                      setCanInstall(false);
                      console.log('PWA install choice', choice);
                    } catch (e) {
                      console.warn('Install prompt failed', e);
                    }
                  }}
                  className="p-2 border border-primary text-primary rounded inline-flex items-center justify-center"
                  aria-label="Instalar aplicación"
                >
                  Instalar
                </button>
              )}
            </div>
          </div>
          {children}
        </div>
        {/* Registro del service worker desde componente cliente */}
        <SwMount />
        {/* Floating install button (bottom center) */}
        {canInstall && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="max-w-xs w-full px-4">
              <button
                onClick={async () => {
                  if (!deferredPrompt) return;
                  try {
                    await deferredPrompt.prompt();
                    const choice = await deferredPrompt.userChoice;
                    setDeferredPrompt(null);
                    setCanInstall(false);
                    console.log('PWA install choice', choice);
                  } catch (e) {
                    console.warn('Install prompt failed', e);
                  }
                }}
                className="w-full bg-primary text-white py-3 rounded-lg shadow-lg text-center"
                aria-label="Instalar aplicación"
              >
                Instalar aplicación
              </button>
            </div>
          </div>
        )}
      </body>
    </html>
  )
}
