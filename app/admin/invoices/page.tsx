"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../../components/SideMenu";
import facturasApi from "../../lib/Facturas";

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
          // normalize: prefer res.facturas or res.data
          const list = res.facturas ?? (Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data ?? []));
          setInvoices(list || []);
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
                        // tienda name heuristics
                        const tiendaName = (f.tienda && (f.tienda.nombre || f.tienda.name)) || f.tienda_nombre || f.tiendaName || f.tienda_id || '';
                        // cliente name heuristics
                        const clienteName = (f.cliente && (f.cliente.nombre || f.cliente.name)) || f.cliente_nombre || f.clienteName || f.cliente_id || '';
                        // items summary
                        const itemsArr = Array.isArray(f.items) ? f.items : (Array.isArray(f.detalles) ? f.detalles : []);
                        const itemsCount = itemsArr.length;
                        const itemNames = itemsArr.slice(0,3).map((it: any) => {
                          const cand = it?.nombre || it?.name || it?.producto_nombre || it?.producto?.nombre || it?.producto?.name || it?.product?.nombre || it?.product?.name || '';
                          const s = cand ? String(cand).trim() : '';
                          // skip pure numeric values (ids)
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
