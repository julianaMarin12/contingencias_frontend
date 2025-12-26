"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import clientsApi, { Client } from '../lib/clients';

type NewClient = { nombre?: string; cedula?: string; correo?: string; Empleado?: boolean };
import facturasApi from '../lib/Facturas';

function formatPrice(val: number | string | null | undefined) {
  try {
    if (val == null) return '$0';
    const n = Number(val) || 0;
    const isInt = Math.abs(n - Math.round(n)) < 0.01;
    if (isInt) return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
    return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch (e) { return String(val); }
}

export default function CartPage() {
  const search = useSearchParams();
  const storeIdParam = search?.get('storeId') ?? null;
  const storeNameParam = search?.get('storeName') ?? null;
  const [cart, setCart] = useState<Record<string, any>>({});
  const [storeId, setStoreId] = useState<string | null>(storeIdParam);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeNit, setStoreNit] = useState<string | null>(null);
  const [consecutive, setConsecutive] = useState<number>(1);
  const [printInvoiceNumber, setPrintInvoiceNumber] = useState<number | null>(null);
  const [printSnapshot, setPrintSnapshot] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsFiltered, setClientsFiltered] = useState<Client[]>([]);
  const [searchCedula, setSearchCedula] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState<{ nombre?: string; cedula?: string; correo?: string; Empleado?: boolean }>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('cart_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setCart(parsed);
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    try {
      if ((!storeId || storeId === null) && cart) {
        const candidateId = cart?.store?.id ?? cart?.tienda?.id ?? cart?.storeId ?? cart?.tiendaId ?? null;
        if (candidateId) setStoreId(String(candidateId));
        const candidateName = cart?.store?.nombre ?? cart?.tienda?.nombre ?? cart?.storeName ?? cart?.tiendaName ?? null;
        if (candidateName) setStoreName(String(candidateName));
      }
      if (!storeId) {
        try {
          const g = Number(window.localStorage.getItem('consecutivo_global') || '1') || 1;
          setConsecutive(g);
        } catch (e) {}
      }
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    if (storeIdParam) setStoreId(storeIdParam);
    if (storeNameParam) setStoreName(storeNameParam);
  }, [storeIdParam]);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      try {
        const tryUrls: string[] = [];
        tryUrls.push(`/tiendas/${encodeURIComponent(String(storeId))}`);
        tryUrls.push(`/tiendas?id=${encodeURIComponent(String(storeId))}`);
        if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) tryUrls.push((process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/,'') + '/tiendas/' + encodeURIComponent(String(storeId)));
        let got: any = null;
        for (const url of tryUrls) {
          try {
            const headers: any = {};
            try { const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null; if (token) headers.Authorization = `Bearer ${token}`; } catch (e) {}
            const res = await fetch(url, { headers });
            const data = await (async () => { try { return await res.json(); } catch { return null; } })();
            if (data) { got = data; break; }
          } catch (e) { continue; }
        }

        if (got) {
          const payload = got?.data ? (Array.isArray(got.data) ? got.data[0] : got.data) : (Array.isArray(got) ? got[0] : got);
          if (payload) {
            try { if (payload.nombre) setStoreName(String(payload.nombre)); } catch (e) {}
            try { if (payload.nit) setStoreNit(String(payload.nit)); } catch (e) {}
            try {
              const key = storeId ? `consecutivo_${storeId}` : 'consecutivo_global';
              const storedRaw = window.localStorage.getItem(key) || '';
              const storedNumber = Number(storedRaw);
              if (!Number.isNaN(storedNumber) && storedRaw !== '') setConsecutive(storedNumber);
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('load store error', e);
      }
    })();
  }, [storeId]);
  const initialIsoDate = new Date().toISOString().split('T')[0];
  const [todayStr, setTodayStr] = useState<string>(initialIsoDate);
  useEffect(() => {
    try {
      const s = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      setTodayStr(s);
    } catch (e) { }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await clientsApi.loadClients();
        if (!mounted) return;
        if (res && res.ok) {
          const list = res.clients || [];
          setClients(list);
          const preferred = list.find((c: any) => String(c.cedula ?? c.nit ?? '').replace(/\D/g, '') === '22222222');
          if (preferred) {
            const defaultId = preferred.cliente_id ?? preferred.id ?? null;
            setSelectedClientId(defaultId);
            try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1_client', String(defaultId)); } catch (e) {}
          } else if (list.length > 0) {
            const defaultId = list[0].cliente_id ?? list[0].id ?? null;
            if (!selectedClientId) {
              setSelectedClientId(defaultId);
              try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1_client', String(defaultId)); } catch (e) {}
            }
          }
        }
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try { if (typeof window !== 'undefined') {
      if (selectedClientId == null) window.localStorage.removeItem('cart_v1_client');
      else window.localStorage.setItem('cart_v1_client', String(selectedClientId));
    } } catch (e) {}
  }, [selectedClientId]);

  const enrichingRef = React.useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!cart || typeof window === 'undefined') return;
    const entries = Object.entries(cart);
    for (const [k, itAny] of entries) {
      const it = itAny as any;
    if (enrichingRef.current[k]) continue;
    const needs = (typeof it.price === 'undefined') || (typeof it.unitSubtotal === 'undefined') || (typeof it.iva === 'undefined' && typeof it.impoconsumo === 'undefined' && typeof it.icui === 'undefined');
      if (!needs) continue;
      enrichingRef.current[k] = true;
      (async () => {
        try {
          const pid = it.product_id ?? it.productId ?? it.id ?? k;
          if (!pid) return;
          const tryUrls: string[] = [];
          tryUrls.push(`/productos/${encodeURIComponent(String(pid))}`);
          if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) tryUrls.push((process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+/g, '/') .replace(/\/+$/,'') + '/productos/' + encodeURIComponent(String(pid)));
          let got: any = null;
          for (const url of tryUrls) {
            try {
              const headers: any = {};
              try { const token = window.localStorage.getItem('access_token') || window.localStorage.getItem('token'); if (token) headers.Authorization = `Bearer ${token}`; } catch (e) {}
              const res = await fetch(url, { headers });
              const data = await (async () => { try { return await res.json(); } catch { return null; } })();
              if (data) { got = data; break; }
            } catch (e) { continue; }
          }
          const product = got?.data ? (Array.isArray(got.data) ? got.data[0] : got.data) : (Array.isArray(got) ? got[0] : got);
          if (!product) return;
          let priceEntry: any = null;
          if (Array.isArray(product.precios) && product.precios.length > 0) priceEntry = product.precios[0];
          else if (product.precio || product.precio_unitario) priceEntry = product;
          const unitPrice = Number(priceEntry?.precio ?? priceEntry?.precio_unitario ?? product?.precio ?? it.price ?? 0);
          const unitSubtotal = priceEntry?.subtotal != null ? Number(priceEntry?.subtotal) : undefined;
          const ivaU = Number(priceEntry?.iva ?? product?.iva ?? 0);
          const impU = Number(priceEntry?.impoconsumo ?? product?.impoconsumo ?? 0);
          const icuiU = Number(priceEntry?.icui ?? product?.icui ?? 0);
          const qty = Number(it.qty || 0);
          const computedSubtotal = typeof unitSubtotal !== 'undefined' ? (unitSubtotal * qty) : (typeof it.subtotal !== 'undefined' ? Number(it.subtotal) : unitPrice * qty);
          const updated = { ...cart, [k]: { ...it, price: unitPrice, unitSubtotal: unitSubtotal, iva: ivaU, impoconsumo: impU, icui: icuiU, subtotal: computedSubtotal } };
          try { window.localStorage.setItem('cart_v1', JSON.stringify(updated)); } catch (e) {}
          setCart(updated);
        } catch (e) { console.error('enrich cart item', e); }
      })();
    }
  }, [cart]);

  const displayStoreName = printSnapshot?.tienda?.nombre ?? (storeName || (cart && ((cart.store && cart.store.nombre) || (cart.tienda && cart.tienda.nombre) || (cart.storeName) || (cart.tiendaName))) || 'Tienda');

  const items = (printSnapshot?.items)
        ? (printSnapshot.items as any[]).map((it: any, idx: number) => {
        const qty = Number(it.cantidad ?? it.qty ?? 0);
        const unitPrice = Number(it.unidad_precio ?? it.unitPrice ?? it.precio_unitario ?? 0);
        const unitSubtotal = typeof it.unitSubtotal !== 'undefined' ? Number(it.unitSubtotal) : (unitPrice || undefined);
        const subtotal = typeof it.subtotal !== 'undefined' ? Number(it.subtotal) : (unitSubtotal !== undefined ? unitSubtotal * qty : Number(it.total ?? 0));
        const iva = Number(it.unidad_iva ?? it.iva ?? 0) * qty;
        const impoconsumo = Number(it.unidad_impoconsumo ?? it.impoconsumo ?? 0) * qty;
        const icui = Number(it.unidad_icui ?? it.icui ?? 0) * qty;
        return { id: it.id ?? (`print-${idx}`), qty, name: it.nombre ?? it.name ?? '', unitPrice, unitSubtotal, subtotal, iva, impoconsumo, icui, pendingDetails: it.pendingDetails };
      })
    : Object.keys(cart).map((k: string) => {
      const it = cart[k] as any;
      const unit = Number(it.price ?? 0);
      const unitSubtotal = typeof it.unitSubtotal !== 'undefined' ? Number(it.unitSubtotal) : undefined;
      const qty = Number(it.qty || 0);
      const subtotal = typeof it.subtotal !== 'undefined' ? Number(it.subtotal) : (typeof unitSubtotal !== 'undefined' ? unitSubtotal * qty : qty * unit);
      const iva = Number(it.iva ?? 0) * qty;
      const impoconsumo = Number(it.impoconsumo ?? 0) * qty;
      const icui = Number(it.icui ?? 0) * qty;
      return { id: k, qty: it.qty, name: it.name, unitPrice: unit, unitSubtotal, subtotal, iva, impoconsumo, icui, pendingDetails: it.pendingDetails };
    });

  const subtotalSum = items.reduce((s: number, it: any) => s + Number(it.subtotal || 0), 0);
  const ivaSum = items.reduce((s: number, it: any) => s + Number(it.iva || 0), 0);
  const impoconsumoSum = items.reduce((s: number, it: any) => s + Number(it.impoconsumo || 0), 0);
  const icuiSum = items.reduce((s: number, it: any) => s + Number(it.icui || 0), 0);
  const taxSum = ivaSum + impoconsumoSum + icuiSum;
  const total = subtotalSum + taxSum;

  return (
    <div className="invoice-wrapper" style={{ padding: 12, background: 'transparent', backgroundImage: 'none' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', marginBottom: 8 }}>
        <button onClick={() => { try { try { if (typeof window !== 'undefined') { window.localStorage.removeItem('cart_v1_client'); window.localStorage.removeItem('cart_v1'); } } catch(e){} setSelectedClientId(null); window.history.back(); } catch (e) {} }} style={{ background: 'none', border: 'none', color: '#19A7A6', padding: 8, cursor: 'pointer', fontWeight: 700 }}>← Volver</button>
      </div>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
          {/* Header with store info, not a card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="cart-title" style={{ fontWeight: 800, color: '#19A7A6', fontSize: 16 }}>CARRITO DE PAGO</div>
              <div style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>CAFÉ QUINDÍO S.A.S</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>NIT. 900273380 - 1</div>
              <div className="store-name" style={{ fontWeight: 700, marginTop: 8 }}>{displayStoreName}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{storeNit ? `NIT. ${storeNit}` : ''}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Fecha: {todayStr}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#666' }}>Consecutivo</div>
              <div className="consecutive" style={{ fontWeight: 800, fontSize: 16 }}>{printInvoiceNumber ?? consecutive}</div>
            </div>
          </div>

          {/* Client / meta block */}
          <div style={{ fontSize: 13, color: '#444', marginTop: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6 }}>Cliente:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Buscar por cédula"
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                  onFocus={() => {
                    const one = clients.find((c) => String(c.cliente_id ?? c.id) === '1');
                    if (one) {
                      setClientsFiltered([one]);
                      setSelectedClientId(one.cliente_id ?? one.id ?? null);
                    } else {
                      setClientsFiltered([]);
                    }
                  }}
                  style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #ddd' }}
                />
                <button onClick={() => {
                  const cleaned = String(searchCedula || '').replace(/\D/g, '');
                  if (!cleaned) { alert('Ingresa una cédula para buscar'); return; }
                  const found = clients.filter((c) => String(c.cedula ?? c.cedula) === cleaned || String(c.cedula ?? c.cedula) === searchCedula);
                  if (found.length === 0) { alert('Cliente no encontrado'); setClientsFiltered([]); return; }
                  setClientsFiltered(found);
                  const first = found[0];
                  setSelectedClientId(first.cliente_id ?? first.id ?? null);
                }} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #19A7A6', background: '#19A7A6', color: '#fff' }}>Buscar</button>
                <button onClick={() => setCreatingClient((s: boolean) => !s)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd' }}>{creatingClient ? 'Cancelar' : 'Nuevo'}</button>
              </div>
              {/* show only filtered results (no full list) */}
              {clientsFiltered.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {clientsFiltered.map((c) => (
                    <div key={String(c.cliente_id ?? c.id)} style={{ padding: 6, border: '1px solid #eee', borderRadius: 6, marginBottom: 6, cursor: 'pointer' }} onClick={() => setSelectedClientId(c.cliente_id ?? c.id ?? null)}>
                      {c.nombre ?? c.name} — {c.cedula ?? ''} (ID {String(c.cliente_id ?? c.id)})
                    </div>
                  ))}
                </div>
              )}
              {creatingClient && (
                <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                  <input placeholder="Nombre" value={newClient.nombre ?? ''} onChange={(e) => setNewClient((s: NewClient) => ({ ...s, nombre: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                  <input placeholder="Cédula / NIT" value={newClient.cedula ?? ''} onChange={(e) => setNewClient((s: NewClient) => ({ ...s, cedula: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                  <input placeholder="Correo" value={newClient.correo ?? ''} onChange={(e) => setNewClient((s: NewClient) => ({ ...s, correo: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={Boolean(newClient.Empleado)} onChange={(e) => setNewClient((s: NewClient) => ({ ...s, Empleado: e.target.checked }))} /> Empleado
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                      try {
                        const cedulaVal = newClient.cedula ? parseInt(String(newClient.cedula).replace(/\D/g, ''), 10) : undefined;
                        const payload: any = { nombre: newClient.nombre, correo: newClient.correo, Empleado: Boolean(newClient.Empleado) };
                        if (!Number.isNaN(cedulaVal) && typeof cedulaVal !== 'undefined') payload.cedula = cedulaVal;
                        const res = await clientsApi.createClient(payload);
                        if (res && res.ok) {
                          const created = res.data || (res.data && res.data.cliente) || null;
                          const createdId = (created && (created.cliente_id ?? created.id)) || null;
                          const createdName = (created && (created.nombre ?? created.name)) || (newClient.nombre ?? 'Nuevo cliente');
                          setClients((c: Client[]) => [{ cliente_id: createdId, id: createdId, nombre: createdName, ...created }, ...c]);
                          setSelectedClientId(createdId);
                          try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1_client', String(createdId)); } catch (e) {}
                          setCreatingClient(false);
                          setNewClient({});
                        } else {
                          console.error('createClient failed', res);
                          alert('No se pudo crear el cliente: ' + (res?.data ? JSON.stringify(res.data) : `status ${res?.status}`));
                        }
                      } catch (e) { console.error('createClient error', e); alert('Error al crear cliente: ' + String(e)); }
                    }} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#19A7A6', color: '#fff' }}>Crear cliente</button>
                    <button onClick={() => { setCreatingClient(false); setNewClient({}); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}>Cancelar</button>
                  </div>
                </div>
              )}
              {/* Selected client card (flat) shown under search */}
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const sel = clients.find((c) => String(c.cliente_id ?? c.id) === String(selectedClientId));
                  return sel ? (
                    <div style={{ padding: 10, border: '1px solid #e6e6e6', borderRadius: 6, background: '#fff' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{sel.nombre ?? sel.name ?? 'Cliente'}</div>
                      <div style={{ marginTop: 6, color: '#666' }}><strong>Nit / CC:</strong> {sel.cedula ?? sel.nit ?? ''}</div>
                      <div style={{ color: '#666' }}><strong>Correo:</strong> {sel.correo ?? sel.email ?? ''}</div>
                    </div>
                  ) : (
                    <div style={{ color: '#666' }}>No hay cliente seleccionado</div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* (Resumen banner removed per request) */}

          {/* Items list */}
          <div style={{ marginTop: 12 }}>
            {items.length === 0 ? (
              <div style={{ padding: 16, color: '#666' }}>No hay productos en el carrito</div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {/* Single bordered table-style summary */}
                <div className="items-table" style={{ border: '1px solid #e6e6e6', borderRadius: 8, overflow: 'hidden' }}>
                  <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 2fr 2fr', background: '#f6f6f6', padding: '10px 12px', fontWeight: 700, alignItems: 'center' }}>
                    <div>Cantidad</div>
                    <div>Nombre</div>
                    <div style={{ textAlign: 'right' }}>Precio unitario</div>
                    <div style={{ textAlign: 'right' }}>Precio total</div>
                  </div>
                  {items.map((it: any, idx: number) => (
                    <div key={`row-${it.id}`} style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 2fr 2fr', padding: '12px', alignItems: 'center', borderTop: '1px solid #eee' }}>
                      <div style={{ color: '#666' }}>{it.qty}</div>
                      <div style={{ fontWeight: 700 }}>{it.name}</div>
                      <div style={{ textAlign: 'right', color: '#333' }}>{formatPrice(typeof it.unitSubtotal !== 'undefined' ? it.unitSubtotal : it.unitPrice)}</div>
                      <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(it.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Taxes and total */}
          <div className="total-block" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', padding: '6px 0' }}>
              <div>Subtotal </div>
              <div>{formatPrice(subtotalSum)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', padding: '6px 0' }}>
              <div>IVA</div>
              <div>{formatPrice(ivaSum)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', padding: '6px 0' }}>
              <div>Impoconsumo</div>
              <div>{formatPrice(impoconsumoSum)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', padding: '6px 0' }}>
              <div>ICUI</div>
              <div>{formatPrice(icuiSum)}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', padding: '6px 0', marginTop: 6 }}>
              <div><strong>IMPUESTO</strong></div>
              <div>{formatPrice(taxSum)}</div>
            </div>

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="total-label" style={{ fontWeight: 800, fontSize: 16 }}>TOTAL</div>
              <div className="total-value" style={{ fontWeight: 800, fontSize: 16 }}>{formatPrice(total)}</div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
            <button onClick={async () => {
              try {
                const _prevSelectedClient = selectedClientId;
                try { if (typeof window !== 'undefined' && _prevSelectedClient != null) window.localStorage.setItem('cart_v1_client', String(_prevSelectedClient)); } catch(e) {}
                const payloadRaw: any = {
                  tienda_id: storeId ? Number(storeId) : undefined,
                  cliente_id: selectedClientId ? Number(selectedClientId as any) : undefined,
                  items: items.map((it: any) => ({ producto_id: Number(it.id), cantidad: Number(it.qty || 0) })),
                };
                const payload: any = JSON.parse(JSON.stringify(payloadRaw));

                let createdOk = false;
                let createdData: any = null;
                try {
                  const res = await facturasApi.createFactura(payload);
                  if (res && res.ok) { createdOk = true; createdData = res.data; }
                  else createdOk = false;
                } catch (e) { console.error('create factura error', e); createdOk = false; }

                if (!createdOk) {
                  alert('No se pudo crear la factura. Imprimiendo de todas formas.');
                }

                try {
                  const current = Number(window.localStorage.getItem(storeId ? `consecutivo_${storeId}` : 'consecutivo_global') || String(consecutive)) || consecutive;
                  const key = storeId ? `consecutivo_${storeId}` : 'consecutivo_global';
                  const numero = (createdData && (createdData.numero ?? createdData.numero_factura ?? createdData.id)) || current;
                  const clientObj = clients.find((c) => String(c.cliente_id ?? c.id) === String(selectedClientId)) ?? null;
                  let itemsToPrint = items.map((it: any) => ({
                    id: it.id,
                    nombre: it.name ?? '',
                    cantidad: Number(it.qty || 0),
                    unidad_precio: it.unitSubtotal ?? it.unitPrice ?? 0,
                    subtotal: it.subtotal,
                    unidad_iva: (Number(it.qty || 1) ? (Number(it.iva || 0) / Number(it.qty || 1)) : 0),
                    unidad_impoconsumo: (Number(it.qty || 1) ? (Number(it.impoconsumo || 0) / Number(it.qty || 1)) : 0),
                    unidad_icui: (Number(it.qty || 1) ? (Number(it.icui || 0) / Number(it.qty || 1)) : 0),
                  }));
                  try { console.debug('[print] initial itemsToPrint', itemsToPrint, 'createdData=', createdData); } catch(e){}
                  if (createdData && Array.isArray(createdData.items) && createdData.items.length > 0) {
                    try {
                      const mapById: Record<string, any> = {};
                      for (const si of createdData.items) {
                        const pid = String(si.producto_id ?? si.producto?.id ?? si.producto_id).replace(/\D/g,'');
                        if (!pid) continue;
                        mapById[pid] = si;
                      }
                      itemsToPrint = itemsToPrint.map((it: any) => {
                        const pid = String(it.id).replace(/\D/g,'');
                        const si = mapById[pid];
                        if (si) {
                          const siCantidad = Number(si.cantidad ?? si.cantidad_producto ?? si.cantidad_unidad ?? 1) || 1;
                          const unidadIvaFromSi = Number(si.iva ?? si.unidad_iva ?? si.iva_unitaria ?? 0) / siCantidad;
                          const unidadImpFromSi = Number(si.impoconsumo ?? si.unidad_impoconsumo ?? 0) / siCantidad;
                          const unidadIcuiFromSi = Number(si.icui ?? si.unidad_icui ?? 0) / siCantidad;
                          return { ...it, nombre: si.nombre || si.producto_nombre || si.producto?.nombre || si.producto?.name || si.name || it.nombre, unidad_precio: si.precio_unitario ?? si.unidad_precio ?? si.precio ?? it.unidad_precio, unidad_iva: unidadIvaFromSi || it.unidad_iva, unidad_impoconsumo: unidadImpFromSi || it.unidad_impoconsumo, unidad_icui: unidadIcuiFromSi || it.unidad_icui };
                        }
                        return it;
                      });
                    } catch(e) { console.debug('[print] error mapping createdData items', e); }
                  }
                  const needsFetch = itemsToPrint.some((it: any) => !it.nombre || String(it.nombre).trim() === '' || Number(it.unidad_precio) === 0);
                  if (needsFetch) {
                    const enriched = await Promise.all(itemsToPrint.map(async (it: any) => {
                      try {
                        if (it.nombre && String(it.nombre).trim() && !/^\d+$/.test(String(it.nombre).trim())) return it;
                        const pid = it.id;
                        if (!pid) return it;
                        const tryUrls: string[] = [];
                        tryUrls.push(`/productos/${encodeURIComponent(String(pid))}`);
                        if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) tryUrls.push((process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/,'') + '/productos/' + encodeURIComponent(String(pid)));
                        let got: any = null;
                        for (const url of tryUrls) {
                          try {
                            const headers: any = {};
                            try { const token = window.localStorage.getItem('access_token') || window.localStorage.getItem('token'); if (token) headers.Authorization = `Bearer ${token}`; } catch (e) {}
                            const res = await fetch(url, { headers });
                            const data = await (async () => { try { return await res.json(); } catch { return null; } })();
                            try { console.debug('[print] fetched product', url, res.status, data); } catch(e){}
                            if (data) { got = data; break; }
                          } catch (e) { continue; }
                        }
                        const product = got?.data ? (Array.isArray(got.data) ? got.data[0] : got.data) : (Array.isArray(got) ? got[0] : got);
                        if (!product) return it;
                        const name = product?.nombre || product?.name || product?.titulo || product?.title || product?.producto_nombre || product?.nombre_comercial || product?.nombre_fantasia || product?.descripcion || '';
                        let unitPrice = it.unidad_precio;
                        if ((!unitPrice || Number(unitPrice) === 0)) {
                          let priceEntry: any = null;
                          if (Array.isArray(product.precios) && product.precios.length > 0) priceEntry = product.precios[0];
                          else if (product.precio || product.precio_unitario) priceEntry = product;
                          unitPrice = Number(priceEntry?.subtotal ?? priceEntry?.precio_unitario ?? priceEntry?.precio ?? product?.precio ?? product?.valor ?? 0);
                        }
                        return { ...it, nombre: String(name || it.nombre || '').trim(), unidad_precio: unitPrice, unidad_iva: Number(product?.iva ?? 0), unidad_impoconsumo: Number(product?.impoconsumo ?? 0), unidad_icui: Number(product?.icui ?? 0) };
                      } catch (e) { return it; }
                    }));
                    itemsToPrint = enriched;
                  }
                  try { console.debug('[print] final itemsToPrint', itemsToPrint); } catch(e){}
                  itemsToPrint = itemsToPrint.map((it: any) => {
                    const safeName = (it.nombre && String(it.nombre).trim() && !/^\d+$/.test(String(it.nombre).trim())) ? it.nombre : `Producto ${String(it.id)}`;
                    const safeUnidad = (it.unidad_precio && Number(it.unidad_precio)) ? Number(it.unidad_precio) : (it.cantidad ? (Number(it.subtotal || 0) / Number(it.cantidad || 1)) : 0);
                    return { ...it, nombre: safeName, unidad_precio: safeUnidad };
                  });

                  const snapshot = {
                    tienda: { id: storeId, nombre: displayStoreName, nit: storeNit },
                    cliente: clientObj,
                    items: itemsToPrint.map((it: any) => ({
                      nombre: it.nombre,
                      cantidad: it.cantidad,
                      unidad_precio: it.unidad_precio,
                      subtotal: it.subtotal,
                      unidad_iva: Number(it.unidad_iva ?? it.unidadIva ?? 0),
                      unidad_impoconsumo: Number(it.unidad_impoconsumo ?? it.unidadImpoconsumo ?? 0),
                      unidad_icui: Number(it.unidad_icui ?? it.unidadIcui ?? 0),
                      iva: Number(it.unidad_iva ?? it.unidadIva ?? 0) * Number(it.cantidad || 0),
                      impoconsumo: Number(it.unidad_impoconsumo ?? it.unidadImpoconsumo ?? 0) * Number(it.cantidad || 0),
                      icui: Number(it.unidad_icui ?? it.unidadIcui ?? 0) * Number(it.cantidad || 0),
                    })),
                    total: total,
                    numero,
                    created: (createdData && (createdData.created_at || createdData.fecha)) || new Date().toISOString(),
                  };
                  try { console.debug('[print] snapshot ready', snapshot); } catch(e){}
                  setPrintSnapshot(snapshot);
                  const currentStored = Number(window.localStorage.getItem(key) || String(consecutive)) || consecutive;
                  window.localStorage.setItem(key, String(currentStored + 1));
                  setConsecutive(currentStored + 1);

                  setTimeout(() => {
                    try { window.print(); } catch (e) {}
                    setTimeout(() => {
                      try {
                        if (typeof window !== 'undefined') {
                          if (_prevSelectedClient != null) {
                            window.localStorage.setItem('cart_v1_client', String(_prevSelectedClient));
                          }
                        }
                      } catch (e) {}
                      setPrintSnapshot(null);
                      try { if (_prevSelectedClient != null) setSelectedClientId(_prevSelectedClient); } catch(e){}
                      setTimeout(() => setPrintInvoiceNumber(null), 500);
                    }, 300);
                  }, 120);
                } catch (e) { console.error('prepare print snapshot error', e); }

                
              } catch (e) { console.error(e); alert('Error al crear/imprimir factura'); }
            }} style={{ background: '#19A7A6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              IMPRIMIR
            </button>
          </div>
        </div>
      </div>
  );
}
