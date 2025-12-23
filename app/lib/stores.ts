import { ApiResult, getStores, createStore as createStoreAPI, updateStore as updateStoreAPI, deleteStore as deleteStoreAPI, getStoreById } from "./api";

export type Store = {
  tienda_id?: number;
  id?: number;
  nombre?: string;
  name?: string;
  [k: string]: any;
};

export async function loadStores(usuarioId?: string | number): Promise<ApiResult> {
  try {
    const res = await getStores(usuarioId);
    return res;
  } catch (err) {
    return { ok: false, status: 0, data: null };
  }
}

export async function createStore(payload: any): Promise<ApiResult> {
  return await createStoreAPI(payload);
}

export async function loadStoreById(id: number | string): Promise<ApiResult> {
  try {
    const res = await getStoreById(id);
    return res;
  } catch (err) {
    return { ok: false, status: 0, data: null };
  }
}

export async function updateStore(id: number | string, payload: any): Promise<ApiResult> {
  return await updateStoreAPI(id, payload);
}

export async function deleteStore(id: number | string): Promise<ApiResult> {
  return await deleteStoreAPI(id);
}

export default { loadStores, createStore, updateStore, deleteStore };
