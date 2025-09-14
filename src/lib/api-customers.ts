import { fetchJson } from './fetch-json';

export async function getCustomers(q?: string) {
  const url = q ? `/api/customers?q=${encodeURIComponent(q)}` : '/api/customers';
  return fetchJson(url);
}

export async function getCustomer(id: string | number) {
  return fetchJson(`/api/customers/${id}`);
}

export async function createCustomer(payload: any) {
  return fetchJson('/api/customers', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCustomer(id: string | number, payload: any) {
  return fetchJson(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteCustomer(id: string | number) {
  return fetchJson(`/api/customers/${id}`, { method: 'DELETE' });
}

export async function getCustomerHistory(id: string | number) {
  return fetchJson(`/api/customers/${id}/history`);
}
