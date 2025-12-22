"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStoreById } from "../lib/stores";

export default function Page() {
  const search = useSearchParams();
  const storeId = search?.get("storeId") ?? null;
  const [storeName, setStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!storeId);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!storeId) return;
      setLoading(true);
      try {
        const res = await loadStoreById(storeId);
        // debug
        // eslint-disable-next-line no-console
        console.debug("products.page: loadStoreById ->", res);
        if (!mounted) return;
        let candidate: any = null;
        if (res.data) {
          // data might be object, array, or wrapped
          if (Array.isArray(res.data) && res.data.length > 0) candidate = res.data[0];
          else if (res.data && typeof res.data === "object") {
            // try common keys
            if (res.data.nombre || res.data.name || res.data.tienda_id || res.data.id) candidate = res.data;
            else if (Array.isArray((res.data as any).data) && (res.data as any).data.length > 0) candidate = (res.data as any).data[0];
            else {
              // look for first array value
              for (const k of Object.keys(res.data as any)) {
                if (Array.isArray((res.data as any)[k]) && (res.data as any)[k].length > 0) { candidate = (res.data as any)[k][0]; break; }
              }
            }
          }
        }
        const name = candidate?.nombre ?? candidate?.name ?? null;
        setStoreName(name);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("products.page: load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [storeId]);

  return (
    <div className="page-center">
      <div style={{ textAlign: "center" }}>
        {storeId ? (
          loading ? <p>Cargando tienda...</p> : (storeName ? <h2>TIENDA: {storeName}</h2> : <p>Tienda no encontrada</p>)
        ) : (
          <p>No se seleccionó una tienda.</p>
        )}
      </div>
    </div>
  );
}
