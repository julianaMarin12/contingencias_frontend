import { ApiResult } from "./api";

function getBase() {
  if (typeof window !== 'undefined') return "";
  const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
  return API_BASE ? API_BASE.replace(/\/+$|\s+/g, "") : "";
}

export type Zona = {
  zona_id?: number;
  id?: number;
  codigo?: string;
  nombre?: string;
  [k: string]: any;
};

export async function loadZonas(): Promise<{ ok: boolean; status: number; zonas: Zona[] }> {
  const base = getBase();
  const tryUrls = base ? [`/zonas`, `${base}/zonas`] : [`/zonas`];
  let lastRes: Response | null = null;
  function readToken() {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
    } catch (e) { return null; }
  }
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try { const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`; } catch {}
      const res = await fetch(url, { method: 'GET', headers });
      lastRes = res;
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (data && Array.isArray(data.data)) items = data.data;
      else if (data && Array.isArray(data.zonas)) items = data.zonas;
      else if (data && typeof data === 'object') {
        for (const k of Object.keys(data)) if (Array.isArray((data as any)[k])) { items = (data as any)[k]; break; }
      }
      const zonas = (items || []).map((z: any) => ({ zona_id: z.zona_id ?? z.id, codigo: z.codigo, nombre: z.nombre ?? z.name }));
      if (zonas.length) return { ok: res.ok, status: res.status, zonas };
      if (!res.ok) continue;
    } catch (err) { continue; }
  }
  if (lastRes) {
    const data = await (async () => { try { return await lastRes!.json(); } catch { return null; } })();
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (data && Array.isArray((data as any).data)) items = (data as any).data;
    const zonas = (items || []).map((z: any) => ({ zona_id: z.zona_id ?? z.id, codigo: z.codigo, nombre: z.nombre ?? z.name }));
    return { ok: lastRes.ok, status: lastRes.status, zonas };
  }
  return { ok: false, status: 0, zonas: [] };
}

export async function createZona(payload: any): Promise<ApiResult> {
  const base = getBase();
  const tryUrls = [`/zonas`].concat(base ? [`${base}/zonas`] : []);
  let lastRes: Response | null = null;
  function readToken() {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
    } catch (e) { return null; }
  }
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`; } catch {}
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      return { ok: res.ok, status: res.status, data } as any;
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await (async () => { try { return await lastRes!.json(); } catch { return null; } })(); return { ok: lastRes.ok, status: lastRes.status, data } as any; }
  return { ok: false, status: 0, data: null } as any;
}

export async function updateZona(id: number | string, payload: any): Promise<ApiResult> {
  const base = getBase();
  const idStr = String(id);
  const tryUrls = [`/zonas/${idStr}`].concat(base ? [`${base}/zonas/${idStr}`] : []);
  let lastRes: Response | null = null;
  function readToken() {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
    } catch (e) { return null; }
  }
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`; } catch {}
      const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      return { ok: res.ok, status: res.status, data } as any;
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await (async () => { try { return await lastRes!.json(); } catch { return null; } })(); return { ok: lastRes.ok, status: lastRes.status, data } as any; }
  return { ok: false, status: 0, data: null } as any;
}

export async function deleteZona(id: number | string): Promise<ApiResult> {
  const base = getBase();
  const idStr = String(id);
  const tryUrls = [`/zonas/${idStr}`].concat(base ? [`${base}/zonas/${idStr}`] : []);
  let lastRes: Response | null = null;
  function readToken() {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
    } catch (e) { return null; }
  }
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = {};
      try { const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`; } catch {}
      const res = await fetch(url, { method: 'DELETE', headers });
      lastRes = res;
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      return { ok: res.ok, status: res.status, data } as any;
    } catch (err) { continue; }
  }
  if (lastRes) { const data = await (async () => { try { return await lastRes!.json(); } catch { return null; } })(); return { ok: lastRes.ok, status: lastRes.status, data } as any; }
  return { ok: false, status: 0, data: null } as any;
}

export async function getZonaById(id: number | string): Promise<Zona | null> {
  try {
    const res = await loadZonas();
    if (!res.ok) return null;
    const idNum = Number(id);
    return res.zonas.find((z) => (z.zona_id ?? z.id) === idNum) ?? null;
  } catch (err) {
    return null;
  }
}

export async function getZonaNombre(id: number | string): Promise<string | null> {
  const z = await getZonaById(id);
  if (!z) return null;
  return z.nombre ?? z.codigo ?? String(z.zona_id ?? z.id ?? '');
}

export default { loadZonas, createZona, updateZona, deleteZona, getZonaById, getZonaNombre };
