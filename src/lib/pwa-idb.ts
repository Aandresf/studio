import { openDB } from 'idb';

const DB_NAME = 'pwa-db';
const DB_VERSION = 1;
const STORE_KV = 'kv';

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV, { keyPath: 'key' });
      }
    },
  });
}

export async function setCached(key: string, items: any[]) {
  try {
    const db = await getDb();
    await db.put(STORE_KV, { key, items, ts: Date.now() });
  } catch (e) {
    console.warn('pwa-idb: setCached failed', e);
  }
}

export async function getCached(key: string): Promise<any[] | null> {
  try {
    const db = await getDb();
    const rec = await db.get(STORE_KV, key) as any;
    if (!rec) return null;
    return rec.items || null;
  } catch (e) {
    console.warn('pwa-idb: getCached failed', e);
    return null;
  }
}

export async function clearCached(key: string) {
  try {
    const db = await getDb();
    await db.delete(STORE_KV, key);
  } catch (e) {
    console.warn('pwa-idb: clearCached failed', e);
  }
}

// Convenience helpers
export const setProductsCache = (items: any[]) => setCached('pwa:products', items);
export const getProductsCache = () => getCached('pwa:products');

export const setSalesCache = (items: any[]) => setCached('pwa:sales', items);
export const getSalesCache = () => getCached('pwa:sales');

export const setPurchasesCache = (items: any[]) => setCached('pwa:purchases', items);
export const getPurchasesCache = () => getCached('pwa:purchases');

// Clear all PWA data (IndexedDB keys prefixed with 'pwa:' and localStorage keys)
export async function clearAllPwaData() {
  try {
    const db = await getDb();
    // get all keys and delete those starting with 'pwa:'
    const all = await db.getAll(STORE_KV) as any[];
    if (all && all.length) {
      const dels = all.filter(r => typeof r.key === 'string' && r.key.startsWith('pwa:')).map(r => db.delete(STORE_KV, r.key));
      await Promise.all(dels);
    }
  } catch (e) {
    console.warn('pwa-idb: clearAllPwaData failed', e);
  }
  // also clear localStorage keys that start with 'pwa:'
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(window.localStorage).filter(k => k.startsWith('pwa:'));
      for (const k of keys) window.localStorage.removeItem(k);
    }
  } catch (e) {
    console.warn('pwa-idb: clearing localStorage pwa: keys failed', e);
  }
}
