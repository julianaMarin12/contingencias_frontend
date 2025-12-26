"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../../components/SideMenu";
import facturasApi from "../../lib/Facturas";
import productsApi from "../../lib/products";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await facturasApi.loadFacturas();
        if (!mounted) return;
        if (!res.ok) {
          setInvoices([]);
          setError(`Error ${res.status}`);
        } else {
          const rawList = res.facturas ?? (Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data ?? []));
          const list = rawList || [];
          const enriched = await Promise.all(list.map(async (f: any) => {
            try {
              const itemsArr = Array.isArray(f.items) ? f.items : (Array.isArray(f.detalles) ? f.detalles : []);
              const idsToFetch = new Set<string>();
              for (const it of itemsArr) {
                const nameCand = it?.nombre || it?.name || it?.producto_nombre || it?.producto?.nombre || it?.producto?.name || it?.product?.nombre || it?.product?.name || '';
                if (!nameCand || String(nameCand).trim() === '' || /^\d+$/.test(String(nameCand).trim())) {
                  const pid = (it.producto_id ?? it.producto?.id ?? it.producto_id ?? it.productoId ?? it.producto)?.toString?.() ?? '';
                  if (pid) idsToFetch.add(pid.replace(/\D/g, ''));
                }
              }
              const fetchedById: Record<string, any> = {};
                if (idsToFetch.size > 0) {
                await Promise.all(Array.from(idsToFetch).map(async (pid) => {
                  try {
                    const tryUrls = [`/productos/${encodeURIComponent(String(pid))}`, `/productos?id=${encodeURIComponent(String(pid))}`];
                    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) {
                      const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/g, '');
                      tryUrls.push(base + '/productos/' + encodeURIComponent(String(pid)));
                      tryUrls.push(base + '/productos?id=' + encodeURIComponent(String(pid)));
                    }
                    for (const url of tryUrls) {
                      try {
                        const headers: any = {};
                        try { const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null; if (token) headers.Authorization = `Bearer ${token}`; } catch (e) {}
                        const r = await fetch(url, { headers });
                        const d = await (async () => { try { return await r.json(); } catch { return null; } })();
                        const prod = d?.data ? (Array.isArray(d.data) ? d.data[0] : d.data) : (Array.isArray(d) ? d[0] : d);
                        if (prod) { fetchedById[pid] = prod; break; }
                      } catch (e) { continue; }
                    }
                  } catch (e) {}
                }));
                const missing = Array.from(idsToFetch).filter(id => !fetchedById[id]);
                if (missing.length > 0) {
                  try {
                    const listRes = await productsApi.listProducts();
                    const plist = listRes.products || listRes.data || [];
                    for (const p of plist) {
                      const pid = String(p.producto_id ?? p.id ?? p.producto_id ?? p.id ?? '').replace(/\D/g, '');
                      if (pid && missing.includes(pid)) fetchedById[pid] = p;
                    }
                  } catch (e) {}
                }
              }
              const mappedItems = itemsArr.map((it: any) => {
                const cand = it?.nombre || it?.name || it?.producto_nombre || it?.producto?.nombre || it?.producto?.name || it?.product?.nombre || it?.product?.name || '';
                if (cand && String(cand).trim() && !/^\d+$/.test(String(cand).trim())) return it;
                const pid = String(it.producto_id ?? it.producto?.id ?? it.productoId ?? '').replace(/\D/g, '');
                const prod = pid ? fetchedById[pid] : null;
                if (prod) {
                  return { ...it, nombre: prod.nombre || prod.name || prod.producto_nombre || prod.titulo || String(prod.id || pid) };
                }
                return it;
              });
              return { ...f, items: mappedItems, detalles: mappedItems };
            } catch (e) { return f; }
          }));
          setInvoices(enriched || []);
        }
      } catch (err: any) {
        if (!mounted) return;
        setInvoices([]);
        setError(err?.message ?? String(err));
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: '#fff' }}>
          <h2 style={{ color: '#25abb9', marginTop: 0, fontWeight: 'bold' }}>FACTURAS</h2>
          <div style={{ marginTop: 12 }}>
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Lista de facturas</h3>
              {loading && <p>Cargando facturas...</p>}
              {error && <p style={{ color: 'red' }}>{error}</p>}
              {!loading && !error && (
                <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                    <div style={{ flex: 1, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Número</div>
                    <div style={{ width: 200, padding: '10px 12px' }}>Tienda</div>
                    <div style={{ width: 220, padding: '10px 12px' }}>Cliente</div>
                    <div style={{ width: 240, padding: '10px 12px' }}>Productos</div>
                    <div style={{ width: 140, padding: '10px 12px' }}>Total</div>
                    <div style={{ width: 160, padding: '10px 12px' }}>Fecha</div>
                  </div>
                  <div>
                    {(!invoices || invoices.length === 0) ? (
                      <div style={{ padding: 12, color: '#666' }}>No se encontraron facturas.</div>
                    ) : (
                      invoices.map((f: any) => {
                        const numero = f.numero ?? f.id ?? f.factura_id ?? '';
                        const tiendaName = (f.tienda && (f.tienda.nombre || f.tienda.name)) || f.tienda_nombre || f.tiendaName || f.tienda_id || '';
                        const clienteName = (f.cliente && (f.cliente.nombre || f.cliente.name)) || f.cliente_nombre || f.clienteName || f.cliente_id || '';
                        const itemsArr = Array.isArray(f.items) ? f.items : (Array.isArray(f.detalles) ? f.detalles : []);
                        const itemsCount = itemsArr.length;
                        const itemNames = itemsArr.slice(0,3).map((it: any) => {
                          const cand = it?.nombre || it?.name || it?.producto_nombre || it?.producto?.nombre || it?.producto?.name || it?.product?.nombre || it?.product?.name || '';
                          const s = cand ? String(cand).trim() : '';
                          if (!s || /^\d+$/.test(s)) return null;
                          return s;
                        }).filter(Boolean).join(', ');
                        const itemsSummary = itemsCount === 0 ? '-' : (itemsCount === 1 ? itemNames || '1 producto' : `${itemsCount} productos${itemNames ? ': ' + itemNames : ''}`);
                        const totalStr = typeof f.total !== 'undefined' ? `$${Number(f.total).toLocaleString('es-CO')}` : '';
                        const fecha = f.created_at ? new Date(f.created_at).toLocaleString('es-CO') : (f.fecha ?? f.fecha_creacion ?? '');
                        return (
                          <div key={String(numero) + String(Math.random())} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 1, padding: '10px 12px', color: '#19A7A6' }}>{numero}</div>
                            <div style={{ width: 200, padding: '10px 12px' }}>{tiendaName}</div>
                            <div style={{ width: 220, padding: '10px 12px' }}>{clienteName}</div>
                            <div style={{ width: 240, padding: '10px 12px', color: '#333' }}>{itemsSummary}</div>
                            <div style={{ width: 140, padding: '10px 12px' }}>{totalStr}</div>
                            <div style={{ width: 160, padding: '10px 12px' }}>{fecha}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
