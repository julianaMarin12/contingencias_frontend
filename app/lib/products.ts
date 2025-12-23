
export type ApiResult<T = any> = { ok: boolean; status: number; data: T | null };

const API_BASE = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE || '') : '';
const API_BASE_CLEAN = API_BASE ? API_BASE.replace(/\/+$/g, '') : '';

function readToken(): string | null {
	try {
		if (typeof window === 'undefined') return null;
		return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || null;
	} catch (e) {
		return null;
	}
}

async function safeJson(res: Response) {
	try { return await res.json(); } catch (_) { try { return await res.text(); } catch (_) { return null; } }
}

export type Product = { producto_id?: number; id?: number; nombre?: string; [k: string]: any };

function buildTryUrls(path: string) {
	const urls: string[] = [];
	// In browser, prefer relative paths only so Next dev proxy handles backend requests (avoids CORS).
	if (typeof window !== 'undefined') {
		urls.push(path);
		return urls;
	}
	// try relative first (for server-side or tooling), then explicit API_BASE
	urls.push(path);
	if (API_BASE_CLEAN) {
		if (API_BASE_CLEAN.endsWith(path)) urls.push(API_BASE_CLEAN);
		else urls.push(`${API_BASE_CLEAN}${path}`);
	}
	// local dev fallback
	if (!API_BASE_CLEAN && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
		urls.push(`${API_BASE}${path}`);
	}
	return urls;
}

export async function listProducts(): Promise<{ ok: boolean; status: number; products?: Product[]; data?: any }> {
	const tryUrls = buildTryUrls('/productos');
	let lastRes: Response | null = null;
	for (const url of tryUrls) {
		try {
			const headers: Record<string, string> = {};
			const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
			const res = await fetch(url, { headers });
			lastRes = res;
			const data = await safeJson(res);
			let items: any[] = [];
			if (Array.isArray(data)) items = data as any[];
			else if (data && Array.isArray((data as any).productos)) items = (data as any).productos;
			else if (data && Array.isArray((data as any).data)) items = (data as any).data;
			else if (data && typeof data === 'object') {
				for (const k of Object.keys(data)) {
					const v = (data as any)[k];
					if (Array.isArray(v) && v.length > 0 && v.every((it: any) => it && typeof it === 'object')) { items = v as any[]; break; }
				}
			}
			const okFlag = Boolean(res.ok || (Array.isArray(items) && items.length > 0));
			return { ok: okFlag, status: res.status, products: items, data };
		} catch (err) { continue; }
	}
	if (lastRes) {
		const data = await safeJson(lastRes);
		console.debug('listProducts: lastRes', { status: lastRes.status, data });
		let items: any[] = [];
		if (Array.isArray(data)) items = data as any[];
		else if (data && Array.isArray((data as any).productos)) items = (data as any).productos;
		else if (data && Array.isArray((data as any).data)) items = (data as any).data;
		return { ok: lastRes.ok, status: lastRes.status, products: items, data };
	}
	return { ok: false, status: 0, products: [] };
}

export async function createProductFile(file: File): Promise<{ ok: boolean; status: number; data: any }> {
	const tryUrls = buildTryUrls('/productos/upload');
	// also try fallback to /productos
	tryUrls.push(...buildTryUrls('/productos'));
	let lastRes: Response | null = null;
	for (const url of tryUrls) {
		try {
			const token = readToken();
			const fd = new FormData();
			fd.append('file', file, file.name);
			const headers: Record<string, string> = {}; // don't set Content-Type for FormData
			if (token) headers.Authorization = `Bearer ${token}`;
			const res = await fetch(url, { method: 'POST', headers, body: fd });
			lastRes = res;
			const data = await safeJson(res);
			return { ok: res.ok, status: res.status, data };
		} catch (err) {
			continue;
		}
	}
	if (lastRes) { const data = await safeJson(lastRes); return { ok: lastRes.ok, status: lastRes.status, data }; }
	return { ok: false, status: 0, data: null };
}

export default { listProducts, createProductFile };

