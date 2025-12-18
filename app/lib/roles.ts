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

    // payload might be array or wrapped
    if (Array.isArray(payload)) {
      roles = payload.map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
    } else if (payload && Array.isArray((payload as any).data)) {
      roles = (payload as any).data.map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
    } else if (payload && Array.isArray((payload as any).roles)) {
      roles = (payload as any).roles.map((r: any) => ({ rol_id: r.rol_id ?? r.id, nombre: r.nombre ?? r.name, descripcion: r.descripcion ?? r.description }));
    } else if (payload && typeof payload === "object") {
      // try first array field
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
  const DEV_FALLBACK = "http://localhost:3000";
  const base = API_BASE || DEV_FALLBACK;
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

      // eslint-disable-next-line no-console
      console.groupCollapsed(`roles.createRole — POST ${url}`);
      // eslint-disable-next-line no-console
      console.log("payload:", { nombre, descripcion });
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ nombre, descripcion }) });
      const data = await (async () => { try { return await res.json(); } catch { return null; } })();
      // eslint-disable-next-line no-console
      console.log("response:", { url, status: res.status, ok: res.ok, data });
      // eslint-disable-next-line no-console
      console.groupEnd();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(`roles.createRole — error for ${url}`);
      // eslint-disable-next-line no-console
      console.error(err);
      // eslint-disable-next-line no-console
      console.groupEnd();
      continue;
    }
  }

  return { ok: false, status: 0, data: null };
}

export async function updateRole(rol_id: number | string, nombre: string, descripcion: string): Promise<ApiResult> {
  try {
    const id = String(rol_id);
    const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
    const DEV_FALLBACK = "http://localhost:3000";
    const base = API_BASE || DEV_FALLBACK;
    const API_BASE_CLEAN = base ? base.replace(/\/+$/g, "") : "";
    const tryUrls: string[] = [];
    // Prefer the PUT to the resource URL `/roles/{id}` (backend expects id in path)
    // Try relative endpoints first so Next.js can proxy and avoid CORS
    tryUrls.push(`/roles/${id}`, `/roles`);
    // Fallback to absolute backend URLs
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

        // Send only the fields the backend expects in the body (nombre, descripcion).
        // The id is provided in the URL path `/roles/{id}`.
        const body = JSON.stringify({ nombre, descripcion });
        // eslint-disable-next-line no-console
        console.groupCollapsed(`roles.updateRole — PUT ${url}`);
        // eslint-disable-next-line no-console
        console.log("payload:", { nombre, descripcion });
        let res: Response;
        try {
          res = await fetch(url, { method: "PUT", headers, body });
        } catch (fetchErr) {
          // network failure / CORS issue — log and continue to try next URL
          // eslint-disable-next-line no-console
          console.warn(`roles.updateRole fetch failed for ${url}:`, fetchErr);
          // eslint-disable-next-line no-console
          console.groupEnd();
          continue;
        }

        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        // eslint-disable-next-line no-console
        console.log("response:", { url, status: res.status, ok: res.ok, data });
        // eslint-disable-next-line no-console
        console.groupEnd();
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(`roles.updateRole — error for ${url}`);
        // eslint-disable-next-line no-console
        console.error(err);
        // eslint-disable-next-line no-console
        console.groupEnd();
        continue;
      }
    }

    return { ok: false, status: 0, data: null };
  } catch (outerErr) {
    // eslint-disable-next-line no-console
    console.error("roles.updateRole unexpected error:", outerErr);
    return { ok: false, status: 0, data: null };
  }
}

export async function deleteRole(rol_id: number | string): Promise<ApiResult> {
  try {
    const id = String(rol_id);
    const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
    const DEV_FALLBACK = "http://localhost:3000";
    const base = API_BASE || DEV_FALLBACK;
    const API_BASE_CLEAN = base ? base.replace(/\/+$/g, "") : "";
    const tryUrls: string[] = [];
    // try relative first (proxy) then absolute
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

        // eslint-disable-next-line no-console
        console.groupCollapsed(`roles.deleteRole — DELETE ${url}`);
        // eslint-disable-next-line no-console
        console.log("deleting id:", id);
        let res: Response;
        try {
          res = await fetch(url, { method: "DELETE", headers });
        } catch (fetchErr) {
          // network/CORS error — log and continue
          // eslint-disable-next-line no-console
          console.warn(`roles.deleteRole fetch failed for ${url}:`, fetchErr);
          // eslint-disable-next-line no-console
          console.groupEnd();
          continue;
        }

        const data = await (async () => { try { return await res.json(); } catch { return null; } })();
        // eslint-disable-next-line no-console
        console.log("response:", { url, status: res.status, ok: res.ok, data });
        // eslint-disable-next-line no-console
        console.groupEnd();
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(`roles.deleteRole — error for ${url}`);
        // eslint-disable-next-line no-console
        console.error(err);
        // eslint-disable-next-line no-console
        console.groupEnd();
        continue;
      }
    }

    return { ok: false, status: 0, data: null };
  } catch (outerErr) {
    // eslint-disable-next-line no-console
    console.error("roles.deleteRole unexpected error:", outerErr);
    return { ok: false, status: 0, data: null };
  }
}

