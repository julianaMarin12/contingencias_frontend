import { ApiResult } from "./api";

export type User = {
  usuario_id?: number;
  nombre?: string;
  email?: string;
  creado_an?: string;
  rol?: { rol_id?: number; nombre?: string } | null;
};


function getBase() {
  const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
  const base = API_BASE ;
  return base ? base.replace(/\/+$/g, "") : "";
}

export async function loadUsers(): Promise<{ ok: boolean; status: number; users: User[]; attempted?: string[]; error?: string | null }> {
  const API_BASE_CLEAN = getBase();
  const tryUrls: string[] = [`/users`];
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/users`);
  const attempted: string[] = [];

  for (const url of tryUrls) {
    attempted.push(url);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try { if (typeof window !== "undefined") { const token = window.localStorage.getItem("access_token"); if (token) headers.Authorization = `Bearer ${token}`; } } catch {}
      const res = await fetch(url, { method: "GET", headers });
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      if (!res.ok) continue;

      const payload = data ?? null;
      let items: any[] = [];
      if (Array.isArray(payload)) items = payload;
      else if (payload && Array.isArray(payload.data)) items = payload.data;
      else if (payload && Array.isArray(payload.users)) items = payload.users;
      else if (payload && typeof payload === "object") {
        for (const k of Object.keys(payload)) if (Array.isArray((payload as any)[k])) { items = (payload as any)[k]; break; }
      }

      const users: User[] = (items || []).map((u: any) => ({
        usuario_id: u.usuario_id ?? u.id ?? u.user_id,
        nombre: u.nombre ?? u.name ?? u.username,
        email: u.email ?? u.mail,
        creado_an: u.creado_an ?? u.created_at ?? u.createdAt ?? null,
        rol: u.rol ? { rol_id: u.rol.rol_id ?? u.rol.id ?? u.rolId, nombre: u.rol.nombre ?? u.rol.name } : null,
      }));

      return { ok: true, status: res.status, users, attempted };
    } catch (err: any) {
      continue;
    }
  }

  return { ok: false, status: 0, users: [], attempted };
}

export async function createUser(nombre: string, email: string, rol_id?: number, password?: string): Promise<ApiResult> {
  const API_BASE_CLEAN = getBase();
  const tryUrls: string[] = [`/users`];
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/users`);
  const attempted: string[] = [];

  for (const url of tryUrls) {
    attempted.push(url);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try { if (typeof window !== "undefined") { const token = window.localStorage.getItem("access_token"); if (token) headers.Authorization = `Bearer ${token}`; } } catch {}
      const payload: any = { nombre, email };
      if (typeof rol_id !== "undefined") payload.rol_id = rol_id;
      if (typeof password !== "undefined") payload.password = password;
      const body = JSON.stringify(payload);

      try {
        const res = await fetch(url, { method: "POST", headers, body });
        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        return { ok: res.ok, status: res.status, data };
      } catch (err: any) {
        
        continue;
      }
    } catch (err: any) {
      continue;
    }
  }

  return { ok: false, status: 0, data: null };
}

export async function updateUser(usuario_id: number | string, nombre: string, email: string, rol_id?: number, password?: string): Promise<ApiResult> {
  const id = String(usuario_id);
  const API_BASE_CLEAN = getBase();
  const tryUrls: string[] = [`/users/${id}`];
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/users/${id}`);
  const attempted: string[] = [];

  for (const url of tryUrls) {
    attempted.push(url);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try { if (typeof window !== "undefined") { const token = window.localStorage.getItem("access_token"); if (token) headers.Authorization = `Bearer ${token}`; } } catch {}
      const payload: any = { nombre, email };
      if (typeof rol_id !== "undefined") payload.rol_id = rol_id;
      if (typeof password !== "undefined") payload.password = password;
      const body = JSON.stringify(payload);
      console.groupCollapsed(`users.updateUser — PUT ${url}`);
      console.log("payload:", payload);
      try {
        const res = await fetch(url, { method: "PUT", headers, body });
        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        console.log("response:", { url, status: res.status, ok: res.ok, data });
        return { ok: res.ok, status: res.status, data };
      } catch (err: any) {
     
        continue;
      }
    } catch (err: any) {
      continue;
    }
  }

  return { ok: false, status: 0, data: null };
}

export async function deleteUser(usuario_id: number | string): Promise<ApiResult> {
  const id = String(usuario_id);
  const API_BASE_CLEAN = getBase();
  const tryUrls: string[] = [`/users/${id}`];
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/users/${id}`);
  const attempted: string[] = [];
  for (const url of tryUrls) {
    attempted.push(url);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try { if (typeof window !== "undefined") { const token = window.localStorage.getItem("access_token"); if (token) headers.Authorization = `Bearer ${token}`; } } catch {}
      console.groupCollapsed(`users.deleteUser — DELETE ${url}`);
      try {
        const res = await fetch(url, { method: "DELETE", headers });
        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        return { ok: res.ok, status: res.status, data };
      } catch (err: any) {
        continue;
      }
    } catch (err: any) {
      continue;
    }
  }
  return { ok: false, status: 0, data: null };
}

