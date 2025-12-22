export type ApiResult<T=any> = { ok: boolean; status: number; data: T | null };

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
const API_BASE_CLEAN = API_BASE ? API_BASE.replace(/\/+$/g, "") : "";

function getAuthHeaders(): HeadersInit {
  try {
    if (typeof window === "undefined") return {};
    const token = window.localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  } catch {
    return {};
  }
}

export async function postLogin(nombre: string, password: string): Promise<ApiResult> {
  const candidateUrls: string[] = [];
  candidateUrls.push("/auth/login");
  if (API_BASE_CLEAN) candidateUrls.push(`${API_BASE_CLEAN}/auth/login`);


  let res: Response | null = null;
  let lastErr: any = null;
  let chosenUrl: string | null = null;
  for (const url of candidateUrls) {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, password }),
      });
      chosenUrl = url;
      break; 
    } catch (err) {
      lastErr = err;
      res = null;
      continue;
    }
  }

  if (!res) {
    return { ok: false, status: 0, data: null };
  }
  const data = await safeJson(res);

  try {
    if (data && (data as any).access_token && typeof window !== "undefined") {
      window.localStorage.setItem("access_token", (data as any).access_token);
    }
  } catch {}

  return { ok: res.ok, status: res.status, data };
}

export async function getUsuarios(): Promise<ApiResult> {
  const candidate: string[] = [];
  candidate.push("/users");
  if (API_BASE_CLEAN) candidate.push(`${API_BASE_CLEAN}/users`);
  let res: Response | null = null;
  for (const url of candidate) {
    try {
      res = await fetch(url, { headers: getAuthHeaders() });
      break;
    } catch (err) {
      console.warn("API: getUsuarios fetch failed ->", url, err);
      res = null;
      continue;
    }
  }
  if (!res) return { ok: false, status: 0, data: null };
  const data = await safeJson(res);

  return { ok: res.ok, status: res.status, data };
}

export async function getRoles(): Promise<ApiResult> {
  const tryUrls: string[] = [];
  tryUrls.push("/roles");
  if (API_BASE_CLEAN) {
    tryUrls.push(`${API_BASE_CLEAN}/roles`);
  }

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      console.debug("API: fetching roles ->", url);
      const headers = getAuthHeaders();
      const res = await fetch(url, { headers });
      lastRes = res;
      if (res.status === 404) {
        console.debug("API: 404 for", url);
        continue;
      }
      const data = await safeJson(res);
   
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      continue;
    }
  }

  if (lastRes) {
    const data = await safeJson(lastRes);

    return { ok: lastRes.ok, status: lastRes.status, data };
  }
  return { ok: false, status: 0, data: null };
}

export async function getStores(usuarioId?: string | number): Promise<ApiResult> {
  const qs = usuarioId !== undefined && usuarioId !== null ? `?usuario_id=${encodeURIComponent(String(usuarioId))}` : "";
  const tryUrls: string[] = [];
  tryUrls.push(`/tiendas${qs}`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/tiendas${qs}`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      console.debug("API: fetching stores ->", url);
      const headers = getAuthHeaders();
      const res = await fetch(url, { headers });
      lastRes = res;
      if (res.status === 404) {
        console.debug("API: 404 for", url);
        continue;
      }
      const data = await safeJson(res);
      if (res.ok && (data === null || typeof data === "undefined")) {
        console.debug("API: stores returned OK but data is null for", url);
      }
      console.debug("API: stores response", { url, status: res.status, data });
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn("API: getStores fetch failed ->", url, err);
      continue;
    }
  }

  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data };
  }
  return { ok: false, status: 0, data: null };
}

export async function createStore(payload: any): Promise<ApiResult> {
  const tryUrls: string[] = [];
  tryUrls.push(`/tiendas`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/tiendas`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers = Object.assign({ "Content-Type": "application/json" }, getAuthHeaders() as any);
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn("API: createStore fetch failed ->", url, err);
      continue;
    }
  }
  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data };
  }
  return { ok: false, status: 0, data: null };
}

export async function updateStore(id: number | string, payload: any): Promise<ApiResult> {
  const idStr = String(id);
  const tryUrls: string[] = [];
  tryUrls.push(`/tiendas/${idStr}`);
  tryUrls.push(`/tiendas`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/tiendas`, `${API_BASE_CLEAN}/tiendas/${idStr}`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers = Object.assign({ "Content-Type": "application/json" }, getAuthHeaders() as any);
      const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn("API: updateStore fetch failed ->", url, err);
      continue;
    }
  }
  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data };
  }
  return { ok: false, status: 0, data: null };
}

export async function deleteStore(id: number | string): Promise<ApiResult> {
  const idStr = String(id);
  const tryUrls: string[] = [];
  tryUrls.push(`/tiendas/${idStr}`);
  if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/tiendas/${idStr}`);

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(url, { method: "DELETE", headers });
      lastRes = res;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn("API: deleteStore fetch failed ->", url, err);
      continue;
    }
  }
  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data };
  }
  return { ok: false, status: 0, data: null };
}

export async function getStoreById(id: number | string): Promise<ApiResult> {
  const idStr = String(id);
  const tryUrls: string[] = [];
  tryUrls.push(`/tiendas/${idStr}`);
  tryUrls.push(`/tiendas?id=${encodeURIComponent(idStr)}`);
  if (API_BASE_CLEAN) {
    tryUrls.push(`${API_BASE_CLEAN}/tiendas/${idStr}`);
    tryUrls.push(`${API_BASE_CLEAN}/tiendas?id=${encodeURIComponent(idStr)}`);
  }

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(url, { headers });
      lastRes = res;
      if (res.status === 404) continue;
      const data = await safeJson(res);
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn("API: getStoreById fetch failed ->", url, err);
      continue;
    }
  }
  if (lastRes) {
    const data = await safeJson(lastRes);
    return { ok: lastRes.ok, status: lastRes.status, data };
  }
  return { ok: false, status: 0, data: null };
}

export default { postLogin, getUsuarios, getRoles, getStores };
