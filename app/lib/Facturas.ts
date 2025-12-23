export type ApiResult<T = any> = { ok: boolean; status: number; data: T | null };

// Prefer a configured API base when present (NEXT_PUBLIC_API_BASE), otherwise
// fall back to using the current origin or a relative path.
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

export async function loadFacturas(): Promise<{ ok: boolean; status: number; facturas?: any[]; data?: any }> {
  const tryUrls: string[] = [];
  if (typeof window !== 'undefined') tryUrls.push(window.location.origin + '/facturas');
  tryUrls.push('/facturas');
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/facturas`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      try { if (typeof window !== 'undefined') console.debug('[Facturas] try url ->', url); } catch (e) {}
      const headers: Record<string, string> = {};
      const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      lastRes = res;
      const data = await safeJson(res);
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (data && Array.isArray((data as any).data)) items = (data as any).data;
      else if (data && Array.isArray((data as any).facturas)) items = (data as any).facturas;
      return { ok: res.ok, status: res.status, facturas: items, data };
    } catch (err) { continue; }
  }
  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data, facturas: Array.isArray(data) ? data : (data && Array.isArray((data as any).facturas) ? (data as any).facturas : []) };
  }
  return { ok: false, status: 0, facturas: [] };
}

export async function createFactura(payload: any): Promise<{ ok: boolean; status: number; data: any }> {
  const tryUrls: string[] = [];
  if (typeof window !== 'undefined') tryUrls.push(window.location.origin + '/facturas');
  tryUrls.push('/facturas');
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/facturas`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      try { if (typeof window !== 'undefined') console.debug('[Facturas] try url ->', url); } catch (e) {}
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

export async function getFactura(id: string | number): Promise<{ ok: boolean; status: number; data: any }> {
  const idStr = String(id);
  const tryUrls: string[] = [];
  if (typeof window !== 'undefined') tryUrls.push(window.location.origin + `/facturas/${idStr}`);
  tryUrls.push(`/facturas/${idStr}`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/facturas/${idStr}`);
  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      try { if (typeof window !== 'undefined') console.debug('[Facturas] try url ->', url); } catch (e) {}
      const headers: Record<string, string> = {};
      const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await safeJson(lastRes); return { ok: lastRes.ok, status: lastRes.status, data }; }
  return { ok: false, status: 0, data: null };
}

export default { loadFacturas, createFactura, getFactura };
