export type ServerInfo = {
  ip?: string | null;
  preferredIp?: string | null;
  port?: number | string;
  [key: string]: any;
};

import { getApiBaseCurrent } from './api';

export async function fetchServerInfo(): Promise<ServerInfo | null> {
  try {
    // Prefer explicit runtime API base if set, otherwise fall back to same-origin
    const base = (typeof window !== 'undefined') ? (getApiBaseCurrent() || '') : '';
    const url = base ? `${base.replace(/\/$/, '')}/api/server-info` : '/api/server-info';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('server-info failed');
    return await res.json();
  } catch (err: any) {
    console.error('fetchServerInfo error', err && err.message);
    return null;
  }
}

export function buildApiBaseFromInfo(info: ServerInfo | null): string | null {
  if (!info) return null;
  const ip = (info.ip as string) || (info.preferredIp as string) || 'localhost';
  const port = info.port || 3001;
  return `http://${ip}:${port}`;
}
