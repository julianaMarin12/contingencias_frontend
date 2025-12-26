import { ApiResult } from "./api";

function getBase() {
  if (typeof window !== 'undefined') return "";
  const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
  return API_BASE ? API_BASE.replace(/\/+$/g, "") : "";
}

export type Familia = {
  familia_id?: number;
  id?: number;
  nombre?: string;
  codigo?: string;
  [k: string]: any;
};

export async function loadFamilias(): Promise<{ ok: boolean; status: number; familias: Familia[] }> {
  const base = getBase();
  const tryUrls = base ? [`/familias`, `${base}/familias`] : [`/familias`];
  let lastRes: Response | null = null;
  function readToken() {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
    } catch (e) { return null; }
  }
  for (const url of tryUrls) {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      try { const token = readToken(); if (token) headers.Authorization = `Bearer ${token}` } catch {}
      const res = await fetch(url, { method: 'GET', headers });
      lastRes = res;
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (data && Array.isArray((data as any).data)) items = (data as any).data;
      else if (data && Array.isArray((data as any).familias)) items = (data as any).familias;
      else if (data && typeof data === 'object') {
        for (const k of Object.keys(data)) if (Array.isArray((data as any)[k])) { items = (data as any)[k]; break; }
      }
      const familias = (items || []).map((f: any) => ({ ...f, familia_id: f.familia_id ?? f.id, nombre: f.nombre ?? f.name, codigo: f.codigo }));
      if (familias.length) return { ok: res.ok, status: res.status, familias };
      if (!res.ok) continue;
    } catch (err) { continue; }
  }
  if (lastRes) {
    const data = await (async () => { try { return await lastRes!.json(); } catch { return null; } })();
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (data && Array.isArray((data as any).data)) items = (data as any).data;
    const familias = (items || []).map((f: any) => ({ ...f, familia_id: f.familia_id ?? f.id, nombre: f.nombre ?? f.name, codigo: f.codigo }));
    return { ok: lastRes.ok, status: lastRes.status, familias };
  }
  return { ok: false, status: 0, familias: [] };
}

export async function createFamilia(payload: any): Promise<ApiResult> {
  const base = getBase();
  const tryUrls = ['/familias'].concat(base ? [`${base}/familias`] : []);
  let lastRes: Response | null = null;
  function readToken() { try { if (typeof window === 'undefined') return null; return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null; } catch (e) { return null; } }
  for (const url of tryUrls) {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      try { const token = readToken(); if (token) headers.Authorization = `Bearer ${token}` } catch {}
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      return { ok: res.ok, status: res.status, data } as any;
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await (async () => { try { return await lastRes!.json(); } catch { return null; } })(); return { ok: lastRes.ok, status: lastRes.status, data } as any; }
  return { ok: false, status: 0, data: null } as any;
}

export default { loadFamilias, createFamilia };
