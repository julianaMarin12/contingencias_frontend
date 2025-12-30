import { getRoles, ApiResult } from "./api";

export type Role = { rol_id?: number; nombre?: string; descripcion?: string };

export async function loadRoles(): Promise<{
  ok: boolean;
  status: number;
  roles: Role[];
  attempted?: string[];
  error?: string | null;
}> {
  const res: ApiResult = await getRoles();
  const attempted = (res as any).attempted ?? undefined;

  let roles: Role[] = [];
  try {
    const payload = res.data ?? null;

    if (Array.isArray(payload)) {
      roles = payload.map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
    } else if (payload && Array.isArray((payload as any).data)) {
      roles = (payload as any).data.map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
    } else if (payload && Array.isArray((payload as any).roles)) {
      roles = (payload as any).roles.map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
    } else if (payload && typeof payload === "object") {
      for (const k of Object.keys(payload)) {
        if (Array.isArray((payload as any)[k])) {
          roles = (payload as any)[k].map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
          break;
        }
      }
    }
  } catch (err) {
    return { ok: false, status: res.status, roles: [], attempted, error: String(err) };
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    const errMsg = res.ok ? "no roles in response" : `HTTP ${res.status}`;
    return { ok: res.ok, status: res.status, roles: [], attempted, error: errMsg };
  }

  return { ok: res.ok, status: res.status, roles, attempted, error: null };
}

export async function createRole(nombre: string, descripcion: string): Promise<ApiResult> {
  const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
  const base = API_BASE ;
  const API_BASE_CLEAN = base ? base.replace(/\/+$/g, "") : "";

  const tryUrls: string[] = [];
  tryUrls.push(`/roles`);
  if (API_BASE_CLEAN) {
    tryUrls.push(`${API_BASE_CLEAN}/roles`);
  }

  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        if (typeof window !== "undefined") {
          const token = window.localStorage.getItem("access_token");
          if (token) headers.Authorization = `Bearer ${token}`;
        }
      } catch {}

      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ nombre, descripcion }) });
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {

      continue;
    }
  }

  return { ok: false, status: 0, data: null };
}

export async function updateRole(rol_id: number | string, nombre: string, descripcion: string): Promise<ApiResult> {
  try {
    const id = String(rol_id);
    const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
    const base = API_BASE ;
    const API_BASE_CLEAN = base ? base.replace(/\/+$/g, "") : "";
    const tryUrls: string[] = [];
    tryUrls.push(`/roles/${id}`, `/roles`);
    if (API_BASE_CLEAN) {
      tryUrls.push(`${API_BASE_CLEAN}/roles`, `${API_BASE_CLEAN}/roles/${id}`);
    }

    for (const url of tryUrls) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        try {
          if (typeof window !== "undefined") {
            const token = window.localStorage.getItem("access_token");
            if (token) headers.Authorization = `Bearer ${token}`;
          }
        } catch {}

        const body = JSON.stringify({ nombre, descripcion });
        let res: Response;
        try {
          res = await fetch(url, { method: "PUT", headers, body });
        } catch (fetchErr) {
          continue;
        }

        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        continue;
      }
    }

    return { ok: false, status: 0, data: null };
  } catch (outerErr) {
    return { ok: false, status: 0, data: null };
  }
}

export async function deleteRole(rol_id: number | string): Promise<ApiResult> {
  try {
    const id = String(rol_id);
    const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
    const base = API_BASE ;
    const API_BASE_CLEAN = base ? base.replace(/\/+$/g, "") : "";
    const tryUrls: string[] = [];
    tryUrls.push(`/roles/${id}`);
    if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/roles/${id}`);

    for (const url of tryUrls) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        try {
          if (typeof window !== "undefined") {
            const token = window.localStorage.getItem("access_token");
            if (token) headers.Authorization = `Bearer ${token}`;
          }
        } catch {}

        let res: Response;
        try {
          res = await fetch(url, { method: "DELETE", headers });
        } catch (fetchErr) {
          continue;
        }

        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        continue;
      }
    }

    return { ok: false, status: 0, data: null };
  } catch (outerErr) {
    return { ok: false, status: 0, data: null };
  }
}

export const ROLE_ACCESS: Record<string, string[]> = {
  Barista: ["/stores"],
  Administrador: ["/admin", "/admin/products", "/admin/users", "/admin/stores"],
};

export function canRoleAccessPath(role: any, path: string): boolean {
  if (!role || !path) return false;
  let roleName: string | null = null;
  if (typeof role === "string") roleName = role;
  else if (typeof role === "object") roleName = role.nombre ?? role.name ?? role.rol ?? null;
  if (!roleName) return false;
  const key = Object.keys(ROLE_ACCESS).find((k) => k.toLowerCase() === String(roleName).toLowerCase());
  if (!key) return false;
  const allowed = ROLE_ACCESS[key] ?? [];
  return allowed.some((p) => p === path || path.startsWith(p));
}

