export type ApiResult<T=any> = { ok: boolean; status: number; data: T | null };

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

const API_BASE = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE || "") : "";
const API_BASE_CLEAN = API_BASE ? API_BASE.replace(/\/+$/g, "") : "";

function sanitizeId(id: any): string | null {
  if (id === undefined || id === null) return null;
  const s = String(id).trim();
  if (/^\d+$/.test(s)) return encodeURIComponent(s);
  return null;
}

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
      const headers = getAuthHeaders();
      const res = await fetch(url, { headers });
      lastRes = res;
      if (res.status === 404) {
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
  const tryUrls: string[] = [];
  const sanitized = sanitizeId(usuarioId);
  if (sanitized !== null) {
    tryUrls.push(`/tiendas/${sanitized}`);
    tryUrls.push(`/tiendas?usuario_id=${sanitized}`);
    if (API_BASE_CLEAN) {
      tryUrls.push(`${API_BASE_CLEAN}/tiendas/${sanitized}`);
      tryUrls.push(`${API_BASE_CLEAN}/tiendas?usuario_id=${sanitized}`);
    }
  } else {
    tryUrls.push(`/tiendas`);
    if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/tiendas`);
  }

  let lastRes: Response | null = null;
  for (const url of tryUrls) {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(url, { headers });
      lastRes = res;
      if (res.status === 404) {
        continue;
      }
      const data = await safeJson(res);
      if (res.ok && (data === null || typeof data === "undefined")) {
      }
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
  const idSan = sanitizeId(id);
  const tryUrls: string[] = [];
  if (idSan !== null) tryUrls.push(`/tiendas/${idSan}`);
  tryUrls.push(`/tiendas`);
  if (API_BASE_CLEAN) {
    if (idSan !== null) tryUrls.push(`${API_BASE_CLEAN}/tiendas/${idSan}`);
    tryUrls.push(`${API_BASE_CLEAN}/tiendas`);
  }

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
  const idSan = sanitizeId(id);
  const tryUrls: string[] = [];
  if (idSan !== null) tryUrls.push(`/tiendas/${idSan}`);
  if (API_BASE_CLEAN && idSan !== null) tryUrls.push(`${API_BASE_CLEAN}/tiendas/${idSan}`);

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
  const idSan = sanitizeId(id);
  const tryUrls: string[] = [];
  if (idSan !== null) {
    tryUrls.push(`/tiendas/${idSan}`);
    tryUrls.push(`/tiendas?id=${idSan}`);
    if (API_BASE_CLEAN) {
      tryUrls.push(`${API_BASE_CLEAN}/tiendas/${idSan}`);
      tryUrls.push(`${API_BASE_CLEAN}/tiendas?id=${idSan}`);
    }
  } else {
    tryUrls.push('/tiendas');
    if (API_BASE_CLEAN) tryUrls.push(`${API_BASE_CLEAN}/tiendas`);
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
