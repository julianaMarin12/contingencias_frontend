"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import CategorySideMenu from "../components/CategorySideMenu";
import familiasApi, { Familia } from "../lib/familias";

type Product = {
  producto_id?: string | number;
  id?: string | number;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
  imagen?: string;
  categoria?: string;
};

type CartItem = {
  qty: number;
  name?: string;
  price?: number;
  unitSubtotal?: number;
  subtotal?: number;
  iva?: number;
  impoconsumo?: number;
  icui?: number;
  pendingDetails?: boolean;
  fromInvoice?: boolean;
  [k: string]: any;
};

export default function Page() {
  const search = useSearchParams();
  let storeId = search?.get("storeId") ?? null;
  if (typeof window !== 'undefined' && !storeId) {
    try {
      storeId = window.localStorage.getItem('storeId') ?? window.localStorage.getItem('selectedStore') ?? window.localStorage.getItem('store_id') ?? null;
    } catch (e) { storeId = null; }
  }
  if (storeId && !/^\d+$/.test(String(storeId))) {
    try { if (typeof window !== 'undefined') { window.localStorage.removeItem('storeId'); } } catch (e) {}
    storeId = null;
  }
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeZonaId, setStoreZonaId] = useState<string | number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingStore, setLoadingStore] = useState<boolean>(!!storeId);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(!!storeId);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | number | undefined>(undefined);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [selectedFamiliaId, setSelectedFamiliaId] = useState<string | number | undefined>(undefined);
  const [availableCategories, setAvailableCategories] = useState<{ id?: string | number; label: string }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [pendingAdd, setPendingAdd] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const f = await familiasApi.loadFamilias();
        if (mounted && f.ok) {
          const raw = f.familias || [];
          setFamilias(raw);
        }
      } catch (err) { console.error(err); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadStoreName() {
      if (!storeId) return;
      setLoadingStore(true);
      try {
        const tryUrls = [] as string[];
        tryUrls.push(`/tiendas/${encodeURIComponent(String(storeId))}`);
        tryUrls.push(`/tiendas?id=${encodeURIComponent(String(storeId))}`);
        if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_API_BASE) tryUrls.push((process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/,'') + '/tiendas/' + encodeURIComponent(String(storeId)));
        let got: any = null;
        for (const url of tryUrls) {
          try {
            const headers: any = {};
            const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(url, { headers });
            const data = await (async () => { try { return await res.json(); } catch { return null; } })();
            if (res.ok && data) { got = data; break; }
            if (data && typeof data === 'object') { got = data; break; }
          } catch (e) { continue; }
        }
        const candidate = got?.data ? (Array.isArray(got.data) ? got.data[0] : got.data) : (Array.isArray(got) ? got[0] : got);
        const name = candidate?.nombre ?? candidate?.name ?? null;
        const zonaIdFromStore = candidate?.zona_id ?? candidate?.zonaId ?? candidate?.zona?.id ?? candidate?.zona?.zona_id ?? null;
        if (mounted) {
          setStoreName(name);
          setStoreZonaId(zonaIdFromStore ?? null);
        }
      } catch (err) {
        console.error(err);
      } finally { if (mounted) setLoadingStore(false); }
    }

        async function loadProducts() {
      setLoadingProducts(true);
      try {
        const parts: string[] = [];
        if (categoryId) parts.push(`categoria/${encodeURIComponent(String(categoryId))}`);
        if (storeZonaId) parts.push(`zona/${encodeURIComponent(String(storeZonaId))}`);
        let qs = '';
        if (storeId) qs = `?tienda_id=${encodeURIComponent(String(storeId))}`;

        const tryUrls: string[] = [];
        const path = parts.length ? `/productos/${parts.join('/')}` : `/productos`;
        tryUrls.push(`${path}${qs}`);
        if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_API_BASE) tryUrls.push((process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/,'') + path + qs);

        let last: any = null;
        for (const url of tryUrls) {
          try {
            const headers: any = {};
            const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(url, { headers });
            const data = await (async () => { try { return await res.json(); } catch { return null; } })();
            if (data) {
              last = data;
              let arr: any[] = [];
              if (Array.isArray(data)) arr = data;
              else if (Array.isArray(data.data)) arr = data.data;
              else if (Array.isArray(data.productos)) arr = data.productos;
              else {
                const vals = Object.values(data || {});
                if (vals.every((v) => typeof v === 'object')) arr = vals as any[];
              }
              if (arr.length > 0) { setProducts(arr); break; }
            }
          } catch (e) { continue; }
        }
        if (!last) setProducts([]);
      } catch (err) { console.error(err); setProducts([]); }
      finally { setLoadingProducts(false); }
    }

    loadStoreName();
    loadProducts();
    return () => { mounted = false; };
  }, [storeId, categoryId]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem('cart_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setCart(parsed);
      }
    } catch (e) {}
  }, []);

  const filtered = products.filter((p) => {
    const name = (p.nombre ?? p.name ?? "").toString().toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    return true;
  });

  const router = useRouter();

  function formatPrice(val: number | string | null | undefined) {
    try {
      if (val == null) return '';
      const n = Number(val) || 0;
      const isInt = Math.abs(n - Math.round(n)) < 0.01;
      if (isInt) return `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
      return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (e) { return String(val); }
  }

  function resolvePrice(prod: any, zona: any) {
    try {
      if (prod == null) return 0;
      if (prod.precio != null) return prod.precio;
      if (prod.price != null) return prod.price;
      const possible = prod.precios || prod.precios_por_zona || prod.preciosPorZona || prod.precios_zona || prod.preciosByZona || prod.preciosDetalle || null;
      if (Array.isArray(possible) && possible.length) {
        if (zona != null) {
          const found = possible.find((it: any) => String(it?.zona_id ?? it?.zonaId ?? it?.zona?.id ?? it?.zona ?? '') === String(zona));
          if (found) return found.precio ?? found.price ?? found.valor ?? found.amount ?? 0;
        }
        const first = possible[0];
        return first?.precio ?? first?.price ?? first?.valor ?? first?.amount ?? 0;
      }
      if (possible && typeof possible === 'object' && !Array.isArray(possible)) {
        if (zona != null && possible[String(zona)] != null) return possible[String(zona)];
        const vals = Object.values(possible);
        if (vals.length) return vals[0];
      }
      return 0;
    } catch (e) { return 0; }
  }

  function resolvePriceAndSubtotal(prod: any, zona: any) {
    try {
      if (prod == null) return { price: 0, subtotal: undefined };
      const possible = prod.precios || prod.precios_por_zona || prod.preciosPorZona || prod.precios_zona || prod.preciosByZona || prod.preciosDetalle || null;
      let chosen: any = null;
      if (Array.isArray(possible) && possible.length) {
        if (zona != null) {
          chosen = possible.find((it: any) => String(it?.zona_id ?? it?.zonaId ?? it?.zona?.id ?? it?.zona ?? '') === String(zona));
        }
        if (!chosen) chosen = possible[0];
      } else if (possible && typeof possible === 'object' && !Array.isArray(possible)) {
        if (zona != null && possible[String(zona)] != null) chosen = possible[String(zona)];
        else {
          const vals = Object.values(possible);
          if (vals.length) chosen = vals[0];
        }
      }
      const priceVal = Number(chosen?.precio ?? chosen?.price ?? prod?.precio ?? prod?.price ?? 0);
      const subtotalValRaw = chosen?.subtotal ?? chosen?.subTotal ?? chosen?.valor ?? undefined;
      const subtotalVal = typeof subtotalValRaw !== 'undefined' ? Number(subtotalValRaw) : undefined;
      return { price: priceVal, subtotal: subtotalVal };
    } catch (e) { return { price: 0, subtotal: undefined }; }
  }

  function addInvoiceToCart(payload: any) {
    try {
      if (!payload || !Array.isArray(payload.items)) return;
      const items = payload.items;
      setCart((cur) => {
        const next = { ...cur };
        for (const it of items) {
          const id = String(it.producto_id ?? it.id);
          const qty = Number(it.cantidad ?? it.qty ?? 0) || 0;
          if (qty <= 0) continue;
          const namePlaceholder = `Producto ${id}`;
          const existing = next[id]?.qty || 0;
          next[id] = { ...(next[id] || {}), qty: existing + qty, name: next[id]?.name ?? namePlaceholder, price: next[id]?.price ?? 0, pendingDetails: true, fromInvoice: true } as any;
          (async (pid: string, qtyLocal: number) => {
            try {
              const tryUrls = [] as string[];
              tryUrls.push(`/productos/${encodeURIComponent(String(pid))}`);
              tryUrls.push(`/productos?id=${encodeURIComponent(String(pid))}`);
              if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) tryUrls.push((process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/,'') + '/productos/' + encodeURIComponent(String(pid)));
              let fetched: any = null;
              for (const url of tryUrls) {
                try {
                  const headers: any = {};
                  try { const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null; if (token) headers.Authorization = `Bearer ${token}`; } catch (e) {}
                  const res = await fetch(url, { headers });
                  const data = await (async () => { try { return await res.json(); } catch { return null; } })();
                  if (!data) continue;
                  if (Array.isArray(data)) fetched = data[0];
                  else if (Array.isArray(data.data)) fetched = data.data[0];
                  else if (Array.isArray((data as any).productos)) fetched = (data as any).productos[0];
                  else if (data && typeof data === 'object') fetched = data;
                  if (fetched) break;
                } catch (e) { continue; }
              }
              if (!fetched) return;
              const preciosArr = (fetched.precios || fetched.precios_por_zona || fetched.preciosPorZona || fetched.precios_zona || fetched.preciosDetalle || []);
              let chosen: any = null;
              if (Array.isArray(preciosArr) && preciosArr.length) {
                if (storeZonaId != null) {
                  chosen = preciosArr.find((x: any) => String(x?.zona_id ?? x?.zonaId ?? x?.zona?.id ?? '') === String(storeZonaId));
                }
                if (!chosen) chosen = preciosArr[0];
              }
              const unitFromApi = chosen ? Number(chosen.precio ?? chosen.price ?? 0) : (fetched.precio ?? fetched.price ?? 0);
              const subtotalFromApi = chosen ? Number(chosen.subtotal ?? chosen.subtotal ?? 0) : (typeof fetched.subtotal !== 'undefined' ? Number(fetched.subtotal) : undefined);
              const ivaFromApi = chosen ? Number(chosen.iva ?? 0) : (fetched.iva ?? 0);
              const impoconsumoFromApi = chosen ? Number(chosen.impoconsumo ?? 0) : (fetched.impoconsumo ?? 0);
              const icuiFromApi = chosen ? Number(chosen.icui ?? 0) : (fetched.icui ?? 0);
              const nameFromApi = fetched.nombre ?? fetched.name ?? namePlaceholder;
              setCart((c2) => {
                const copy = { ...c2 } as any;
                const existing2 = copy[pid]?.qty || 0;
                copy[pid] = {
                  qty: existing2,
                  name: nameFromApi,
                  price: unitFromApi,
                  subtotal: subtotalFromApi != null ? subtotalFromApi : (existing2 * Number(unitFromApi || 0)),
                  iva: ivaFromApi,
                  impoconsumo: impoconsumoFromApi,
                  icui: icuiFromApi,
                  pendingDetails: false,
                  fromInvoice: true,
                };
                try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1', JSON.stringify(copy)); } catch (e) {}
                return copy;
              });
            } catch (e) { console.error('background fetch product error', e); }
          })(id, qty);
        }
        try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } catch (e) { console.error('addInvoiceToCart error', e); }
  }

  function saveCartToStorage(c: Record<string, CartItem>) {
    try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1', JSON.stringify(c)); } catch (e) {}
  }

  function dec(id: string) {
    setPendingAdd((p) => {
      const cur = p[id] || 0;
      if (cur > 0) {
        if (cur <= 1) {
          const copy = { ...p };
          delete copy[id];
          return copy;
        }
        return { ...p, [id]: cur - 1 };
      }
      return p;
    });

    setCart((c) => {
      const cur = c[id]?.qty || 0;
      if (cur <= 1) {
        if (cur === 0) return c;
        const copy = { ...c };
        delete copy[id];
        saveCartToStorage(copy);
        return copy;
      }
      const next = { ...c, [id]: { ...(c[id] || { qty: 0 }), qty: cur - 1 } };
      saveCartToStorage(next);
      return next;
    });
  }

  function addPending(id: string) {
    setPendingAdd((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  }

  function applyPendingAdd(id: string, meta?: { name?: string; price?: number; unitSubtotal?: number }) {
    const qty = pendingAdd[id] || 0;
    if (qty <= 0) return;
    setCart((c) => {
      const cur = c[id]?.qty || 0;
      const unitPrice = meta?.price ?? c[id]?.price ?? 0;
      const unitSub = meta?.unitSubtotal ?? c[id]?.unitSubtotal ?? undefined;
      const subtotal = typeof unitSub !== 'undefined' ? unitSub * (cur + qty) : (typeof c[id]?.subtotal !== 'undefined' ? Number(c[id].subtotal) + unitPrice * qty : (cur + qty) * unitPrice);
      const next = { ...c, [id]: { qty: cur + qty, name: meta?.name ?? c[id]?.name, price: unitPrice, unitSubtotal: unitSub, subtotal } };
      saveCartToStorage(next);
      return next;
    });
    setPendingAdd((p) => { const copy = { ...p }; delete copy[id]; return copy; });
  }

  const cartItems = Object.keys(cart).map((k) => {
    const it = cart[k] as any;
    const unit = it.price ?? 0;
    const unitSubtotal = typeof it.unitSubtotal !== 'undefined' ? Number(it.unitSubtotal) : undefined;
    const subtotal = typeof it.subtotal !== 'undefined' ? Number(it.subtotal) : (it.qty || 0) * (typeof unitSubtotal !== 'undefined' ? unitSubtotal : Number(unit || 0));
    return { id: k, qty: it.qty, name: it.name, unitPrice: unit, unitSubtotal, subtotal, iva: it.iva, impoconsumo: it.impoconsumo, icui: it.icui, pendingDetails: it.pendingDetails, fromInvoice: it.fromInvoice };
  });

  function logout() {
    try { if (typeof window !== 'undefined') { window.localStorage.removeItem('access_token'); window.localStorage.removeItem('token'); } } catch (e) {}
    if (typeof window !== 'undefined') window.location.href = '/';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <header style={{ position: 'sticky', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 12px', background: '#fff', zIndex: 160, boxShadow: '0 2px 12px rgba(11,37,64,0.06)' }}>
        <div style={{ fontWeight: 800, color: '#19A7A6', fontSize: 20 }}>PRODUCTOS</div>
      </header>

      {/* compact toolbar: filter (opens category menu), search, cart */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'transparent', position: 'sticky', top: 56, zIndex: 150 }}>
        <button aria-label="Filtros" title="Filtros" onClick={() => { try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-category-menu')); } catch (e) {} }} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e6e6e6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 12h10" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 18h4" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Import button removed per UX: invoices will be added directly to cart */}

        <div style={{ flex: 1 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto..." style={{ width: '100%', padding: '10px 12px', borderRadius: 24, border: '1px solid #ddd' }} />
        </div>

        

        <button onClick={() => {
          try {
            const params: string[] = [];
            if (storeId) params.push(`storeId=${encodeURIComponent(String(storeId))}`);
            if (storeName) params.push(`storeName=${encodeURIComponent(String(storeName))}`);
            const qs = params.length ? `?${params.join('&')}` : '';
            router.push(`/cart${qs}`);
          } catch (e) { router.push('/cart'); }
        }} aria-label="Ir al carrito" style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e6e6e6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6h15l-1.5 9h-11L6 6z" stroke="#19A7A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="20" r="1" fill="#19A7A6" />
            <circle cx="18" cy="20" r="1" fill="#19A7A6" />
          </svg>
        </button>
      </div>


      <CategorySideMenu
        categories={familias.map((it) => ({ id: it.familia_id ?? it.id, label: it.nombre ?? String(it.familia_id ?? it.id) }))}
        selected={selectedFamiliaId}
        onSelect={(id) => {
          setSelectedFamiliaId(id);
          const fam = familias.find((f) => String(f.familia_id ?? f.id) === String(id));
          if (fam && Array.isArray((fam as any).categorias)) {
            const cats = ((fam as any).categorias || []).map((c: any) => ({ id: c.categoria_id ?? c.id, label: c.nombre ?? String(c.categoria_id ?? c.id) }));
            setAvailableCategories(cats);
            if (cats.length > 0) {
              const first = cats[0];
              console.debug('Auto-selecting first category ->', first);
              setCategoryId(first.id);
            } else {
              setCategoryId(undefined);
            }
          } else {
            setAvailableCategories([]);
            setCategoryId(undefined);
          }
        }}
        onLogout={logout}
        initialOpen={false}
        showTitle={false}
      />

      {/* category chips for selected familia */}
      {availableCategories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', overflowX: 'auto' }}>
          {availableCategories.map((c, idx) => (
            <button key={`${String(c.id)}-${idx}`} onClick={() => setCategoryId(c.id)} style={{ padding: '6px 10px', borderRadius: 20, border: categoryId === c.id ? '2px solid #19A7A6' : '1px solid #e6e6e6', background: '#fff' }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      <main style={{ padding: 12, paddingTop: 12 }}>
        <div style={{ marginBottom: 8, textAlign: 'center', color: '#333' }}>{storeId ? (loadingStore ? 'Cargando tienda...' : (storeName ?? 'Tienda')) : 'No se seleccionó una tienda'}</div>

        <section>
          {loadingProducts ? <p>Cargando productos...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {filtered.map((p) => {
                const id = String(p.producto_id ?? p.id ?? p.nombre ?? p.name);
                const name = p.nombre ?? p.name ?? 'Producto';
                const img = (p as any).imagen ?? '';
                const { price, subtotal: unitSubtotal } = resolvePriceAndSubtotal(p as any, storeZonaId);
                return (
                  <div key={id} style={{ background: '#fff', borderRadius: 12, padding: 10, boxShadow: '0 6px 18px rgba(11,37,64,0.06)' }}>
                    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, background: '#f6f6f6' }}>
                      {img ? <img src={img} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#aaa' }}>Sin imagen</div>}
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 700 }}>{name}</div>
                    <div style={{ color: '#19A7A6', fontWeight: 700 }}>{formatPrice(unitSubtotal ?? price)}</div>
                    {/* Subtotal visible only in cart, not on product cards */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <button onClick={() => dec(id)} style={{ width: 34, height: 34, borderRadius: 8 }}>-</button>
                      <div style={{ minWidth: 28, textAlign: 'center' }}>{(cart[id]?.qty || 0) + (pendingAdd[id] || 0)}</div>
                      <button onClick={() => addPending(id)} style={{ width: 34, height: 34, borderRadius: 8 }}>+</button>
                      {pendingAdd[id] > 0 && (
                        <button onClick={() => applyPendingAdd(id, { name, price, unitSubtotal })} style={{ marginLeft: 6, background: '#19A7A6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8 }}>
                          Agregar ({pendingAdd[id]})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* small cart dropdown */}
      {cartOpen && (
        <div style={{ position: 'fixed', right: 12, top: 64, width: 300, maxWidth: 'calc(100% - 24px)', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 8px 30px rgba(11,37,64,0.12)' }}>
            <div style={{ fontWeight: 800 }}>Carrito</div>
            <div style={{ marginTop: 8 }}>
              {cartItems.length === 0 ? <div>Carrito vacío</div> : (
                <>
                  {cartItems.map((it) => (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #eee', paddingTop: 8, marginTop: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{it.name}{it.pendingDetails ? ' (Cargando detalles...)' : ''}</div>
                        <div style={{ color: '#666', fontSize: 13 }}>
                          {it.qty} x {formatPrice(typeof it.unitSubtotal !== 'undefined' ? it.unitSubtotal : it.unitPrice)}
                          {typeof it.iva !== 'undefined' && <span> · IVA: {formatPrice(it.iva)}</span>}
                          {typeof it.impoconsumo !== 'undefined' && <span> · Imp. Consumo: {formatPrice(it.impoconsumo)}</span>}
                          {typeof it.icui !== 'undefined' && <span> · ICU: {formatPrice(it.icui)}</span>}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{formatPrice(it.subtotal)}</div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <div>Total</div>
                    <div>{formatPrice(cartItems.reduce((s, it) => s + Number(it.subtotal || 0), 0))}</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button style={{ background: '#19A7A6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Pagar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
