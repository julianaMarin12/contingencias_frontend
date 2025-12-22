"use client";
import React, { useEffect, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { loadStores } from "../lib/stores";
import { useRouter } from "next/navigation";

export default function StoreSelectCard() {
  const [store, setStore] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [debugResp, setDebugResp] = useState<any>(null);
  const router = useRouter();

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return; 
    router.push(`/products?storeId=${encodeURIComponent(String(store))}`);
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let usuarioId: string | number | undefined = undefined;
        try {
          if (typeof window !== "undefined") {
            const token = window.localStorage.getItem("access_token");
            if (token) {
              const parts = token.split('.');
              if (parts.length === 3) {
                try {
                  const b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                  const json = decodeURIComponent(Array.prototype.map.call(atob(b), function(c: string) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  }).join(''));
                  const payload = JSON.parse(json);
                  usuarioId = payload?.usuario_id ?? payload?.usuarioId ?? payload?.id ?? payload?.sub;
                } catch {}
              }
            }
          }
        } catch {}

        const res = await loadStores(usuarioId);
        
        

        if (!mounted) return;

        
        try {
          if (Array.isArray(res.data)) {
            setStores(res.data as any[]);
            return;
          }

          if (res.data && Array.isArray((res.data as any).data)) {
            setStores((res.data as any).data);
            return;
          }
          if (res.data && Array.isArray((res.data as any).stores)) {
            setStores((res.data as any).stores);
            return;
          }

          if (res.data && typeof res.data === "string") {
            try {
              const parsed = JSON.parse(res.data);
              if (Array.isArray(parsed)) { setStores(parsed); return; }
              if (parsed && Array.isArray(parsed.data)) { setStores(parsed.data); return; }
            } catch {}
          }

          if (res.data && typeof res.data === "object") {
            for (const k of Object.keys(res.data as any)) {
              const val = (res.data as any)[k];
              if (Array.isArray(val)) { setStores(val); return; }
            }

            const vals = Object.values(res.data as any);
            if (
              vals.length > 0 &&
              vals.every((v) => v && typeof v === "object" && (((v as any).nombre) || ((v as any).name) || ((v as any).tienda_id) || ((v as any).id)))
            ) {
              setStores(vals as any[]);
              return;
            }
          }

          setStores([]);
        } catch (err) {
          console.error("StoreSelectCard: parse error", err);
          setStores([]);
        }
      } catch (err) {
        console.error("StoreSelectCard: loadStores error", err);
        setStores([]);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="shell" role="main">
      <div className="left-pane">
        <div>
          <div className="brand-title">TIENDAS</div>
          <div className="subtitle">Seleccione la tienda de la Venta</div>
        </div>

        <form className="form-card" onSubmit={handleContinue}>
          <div style={{ position: "relative", width: "100%" }}>
            <select className="input" value={store} onChange={(e) => setStore(e.target.value)}>
              <option value="" disabled>
                SELECCIONA UNA TIENDA
              </option>
              {stores.length === 0 ? (
                    <>
                      <option value="" disabled>Cargando tiendas...</option>
                      {debugResp && (
                        <option value="" disabled>Respuesta: {JSON.stringify(debugResp?.data ?? debugResp)}</option>
                      )}
                    </>
              ) : (
                stores.map((s: any, idx: number) => {
                  const name = s.nombre ?? s.name ?? s.tienda ?? s.store ?? s.label ?? String(s);
                  const id = s.tienda_id ?? s.id ?? s.store_id ?? s.storeId ?? name;
                  return (
                    <option key={String(id) + "-" + idx} value={String(id)}>
                      {String(name)}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <Button type="submit" disabled={!store}>Seguir</Button>
        </form>
      </div>
    </div>
  );

}
