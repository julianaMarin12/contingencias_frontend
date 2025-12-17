export type ApiResult<T=any> = { ok: boolean; status: number; data: T | null };

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

export async function postLogin(nombre: string, password: string): Promise<ApiResult> {
  const url = "/auth/login"; // uses Next rewrite in dev or absolute in prod if configured
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, password }),
  });
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

export async function getUsuarios(): Promise<ApiResult> {
  const url = "/users"; // adjust if your backend uses /usuarios
  const res = await fetch(url);
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

export async function getRoles(): Promise<ApiResult> {
  const url = "/roles"; // adjust if your backend uses /roles
  const res = await fetch(url);
  const data = await safeJson(res);
  return { ok: res.ok, status: res.status, data };
}

export default { postLogin, getUsuarios, getRoles };
