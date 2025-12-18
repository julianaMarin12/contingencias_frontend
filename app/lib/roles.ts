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
