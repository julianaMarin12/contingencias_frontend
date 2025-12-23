export type ApiResult<T = any> = { ok: boolean; status: number; data: T | null };

const API_BASE = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE || '') : '';
const API_BASE_CLEAN = API_BASE ? API_BASE.replace(/\/+$/g, '') : '';

function readToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
  } catch (e) { return null; }
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch {
    try { const txt = await res.text(); return { _raw: txt }; } catch { return null; }
  }
}

export type Client = {
  cliente_id?: number;
  id?: number;
  nombre?: string;
  cedula?: number | string;
  correo?: string;
  Empleado?: boolean;
  [k: string]: any;
};

export async function loadClients(): Promise<{ ok: boolean; status: number; clients?: Client[]; data?: any }> {
  const tryUrls: string[] = [];
  tryUrls.push('/clientes');
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/clientes`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = {};
      const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      lastRes = res;
      const data = await safeJson(res);
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (data && Array.isArray((data as any).data)) items = (data as any).data;
      else if (data && Array.isArray((data as any).clientes)) items = (data as any).clientes;
      else if (data && typeof data === 'object') {
        const vals = Object.values(data || {});
        if (vals.every((v) => Array.isArray(v))) items = vals.flat();
      }
      return { ok: res.ok, status: res.status, clients: items, data };
    } catch (err) { continue; }
  }
  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data, clients: Array.isArray(data) ? data : (data && Array.isArray((data as any).clientes) ? (data as any).clientes : []) };
  }
  return { ok: false, status: 0, clients: [] };
}

export async function createClient(payload: any): Promise<{ ok: boolean; status: number; data: any }> {
  const tryUrls: string[] = [];
  tryUrls.push('/clientes');
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/clientes`);
  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await safeJson(lastRes); return { ok: lastRes.ok, status: lastRes.status, data }; }
  return { ok: false, status: 0, data: null };
}

export async function updateClient(id: number | string, payload: any): Promise<{ ok: boolean; status: number; data: any }> {
  const idStr = String(id);
  const tryUrls: string[] = [];
  tryUrls.push(`/clientes/${idStr}`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/clientes/${idStr}`);
  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await safeJson(lastRes); return { ok: lastRes.ok, status: lastRes.status, data }; }
  return { ok: false, status: 0, data: null };
}

export async function deleteClient(id: number | string): Promise<{ ok: boolean; status: number; data: any }> {
  const idStr = String(id);
  const tryUrls: string[] = [];
  tryUrls.push(`/clientes/${idStr}`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/clientes/${idStr}`);
  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = {};
      const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { method: 'DELETE', headers });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await safeJson(lastRes); return { ok: lastRes.ok, status: lastRes.status, data }; }
  return { ok: false, status: 0, data: null };
}

export default { loadClients, createClient, updateClient, deleteClient };
