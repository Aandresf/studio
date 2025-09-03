// shim for older modules that imported './fetch-json'
import { fetchAPI } from './api';

export async function fetchJson(url: string, opts?: any) {
  // If the url looks like an absolute path including /api, try to call fetchAPI with the path.
  // fetchAPI expects endpoints like '/customers' and will prefix the base URL.
  try {
    if (typeof url === 'string' && url.startsWith('/')) {
      return await (fetchAPI as any)(url, opts || {});
    }
    // Otherwise, fall back to global fetch for full URLs
    const resp = await fetch(url as string, opts as any);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  } catch (err) {
    throw err;
  }
}
