"use client";
import React, { useEffect, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { loadStores } from "../lib/stores";
import { useRouter } from "next/navigation";

export default function StoreSelectCard() {
  const [store, setStore] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const router = useRouter();

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return; 
    try { if (typeof window !== 'undefined') window.localStorage.setItem('storeId', String(store)); } catch (e) {}
    router.push(`/products`);
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let usuarioId: string | number | undefined = undefined;
        try {
          if (typeof window !== "undefined") {
            const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token") || window.localStorage.getItem("accessToken");
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
          const data = res.data;
          let items: any[] = [];

          if (Array.isArray(data)) items = data as any[];
          else if (data && Array.isArray((data as any).data)) items = (data as any).data;
          else if (data && Array.isArray((data as any).stores)) items = (data as any).stores;
          else if (data && Array.isArray((data as any).tiendas)) items = (data as any).tiendas;
          else if (typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) items = parsed;
              else if (parsed && Array.isArray(parsed.data)) items = parsed.data;
            } catch {}
          } else if (data && typeof data === 'object') {
            const maybeStore = data as any;
            const looksLikeStore = ['nombre','name','tienda_id','id','direccion'].some(k => k in maybeStore);
            if (looksLikeStore) items = [maybeStore];
            else {
              for (const k of Object.keys(maybeStore)) {
                const val = (maybeStore as any)[k];
                if (Array.isArray(val)) { items = val; break; }
              }
              if (items.length === 0) {
                const vals = Object.values(maybeStore);
                if (vals.length > 0 && vals.every((v) => v && typeof v === 'object' && (v.nombre || v.name || v.tienda_id || v.id))) items = vals as any[];
              }
            }
          }

          // Filter by usuarioId when provided
          if (usuarioId !== undefined && usuarioId !== null) {
            const uidNum = Number(usuarioId);
            items = items.filter((it: any) => {
              const direct = it.usuario_id ?? it.user_id ?? it.usuarioId ?? it.id_usuario ?? it.owner_id ?? null;
              if (direct !== null && typeof direct !== 'undefined') return Number(direct) === uidNum;
              const usr = it.usuario ?? it.user ?? null;
              if (usr && (usr.usuario_id || usr.id || usr.user_id)) return Number(usr.usuario_id ?? usr.id ?? usr.user_id) === uidNum;
              return false;
            });
          }

          setStores(items as any[]);
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
