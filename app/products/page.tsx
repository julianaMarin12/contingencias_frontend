"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import CategorySideMenu from "../components/CategorySideMenu";

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

export default function Page() {
  const search = useSearchParams();
  const storeId = search?.get("storeId") ?? null;
  const [storeName, setStoreName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingStore, setLoadingStore] = useState<boolean>(!!storeId);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(!!storeId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, { qty: number; name?: string; price?: number }>>({});

  const CATEGORIES = useMemo(() => [
    "BEBIDAS CALIENTES",
    "BEBIDAS FRIAS",
    "PASTELERIA",
    "BEB CAPSULAS",
    "DESAYUNOS",
    "PLATOS COMPLEMENTARIOS",
    "COMBOS",
    "PRODUCTO TERMINADO",
  ], []);

  useEffect(() => {
    let mounted = true;
    async function loadStoreName() {
      if (!storeId) return;
      setLoadingStore(true);
      try {
        // try multiple endpoints to find store by id
        const tryUrls = [] as string[];
        tryUrls.push(`/tiendas/${encodeURIComponent(String(storeId))}`);
        tryUrls.push(`/tiendas?id=${encodeURIComponent(String(storeId))}`);
        if (process.env.NEXT_PUBLIC_API_BASE) tryUrls.push(`${process.env.NEXT_PUBLIC_API_BASE.replace(/\/+$/,'')}/tiendas/${encodeURIComponent(String(storeId))}`);
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
        if (mounted) setStoreName(name);
      } catch (err) {
        console.error(err);
      } finally { if (mounted) setLoadingStore(false); }
    }

    async function loadProducts() {
      if (!storeId) return;
      setLoadingProducts(true);
      try {
        const qs = `?tienda_id=${encodeURIComponent(String(storeId))}`;
        const tryUrls: string[] = [];
        tryUrls.push(`/productos${qs}`);
        if (process.env.NEXT_PUBLIC_API_BASE) tryUrls.push(`${process.env.NEXT_PUBLIC_API_BASE.replace(/\/+$/,'')}/productos${qs}`);
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
              // normalize
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
  }, [storeId]);

  // load cart from localStorage
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
    if (category && String((p.categoria ?? p.categoria ?? '')).toLowerCase() !== category.toLowerCase()) return false;
    return true;
  });

  const router = useRouter();

  function saveCartToStorage(c: Record<string, { qty: number; name?: string; price?: number }>) {
    try { if (typeof window !== 'undefined') window.localStorage.setItem('cart_v1', JSON.stringify(c)); } catch (e) {}
  }

  function inc(id: string, meta?: { name?: string; price?: number }) {
    setCart((c) => {
      const cur = c[id]?.qty || 0;
      const next = { ...c, [id]: { qty: cur + 1, name: meta?.name ?? c[id]?.name, price: meta?.price ?? c[id]?.price } };
      saveCartToStorage(next);
      return next;
    });
  }

  function dec(id: string) {
    setCart((c) => {
      const cur = c[id]?.qty || 0;
      if (cur <= 1) {
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

  const cartItems = Object.keys(cart).map((k) => {
    const it = cart[k];
    return { id: k, qty: it.qty, product: { nombre: it.name, precio: it.price } };
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

        <div style={{ flex: 1 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto..." style={{ width: '100%', padding: '10px 12px', borderRadius: 24, border: '1px solid #ddd' }} />
        </div>

        <button onClick={() => router.push('/cart')} aria-label="Ir al carrito" style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e6e6e6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6h15l-1.5 9h-11L6 6z" stroke="#19A7A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="20" r="1" fill="#19A7A6" />
            <circle cx="18" cy="20" r="1" fill="#19A7A6" />
          </svg>
        </button>
      </div>


      <CategorySideMenu categories={CATEGORIES} selected={category} onSelect={(c) => setCategory(c)} onLogout={logout} initialOpen={false} showTitle={false} />

      <main style={{ padding: 12, paddingTop: 12 }}>
        <div style={{ marginBottom: 8, textAlign: 'center', color: '#333' }}>{storeId ? (loadingStore ? 'Cargando tienda...' : (storeName ?? 'Tienda')) : 'No se seleccionó una tienda'}</div>

        <section>
          {loadingProducts ? <p>Cargando productos...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {filtered.map((p) => {
                const id = String(p.producto_id ?? p.id ?? p.nombre ?? p.name);
                const name = p.nombre ?? p.name ?? 'Producto';
                const price = p.precio ?? p.price ?? 0;
                const img = (p as any).imagen ?? '';
                return (
                  <div key={id} style={{ background: '#fff', borderRadius: 12, padding: 10, boxShadow: '0 6px 18px rgba(11,37,64,0.06)' }}>
                    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, background: '#f6f6f6' }}>
                      {img ? <img src={img} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#aaa' }}>Sin imagen</div>}
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 700 }}>{name}</div>
                    <div style={{ color: '#19A7A6', fontWeight: 700 }}>${Number(price).toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <button onClick={() => dec(id)} style={{ width: 34, height: 34, borderRadius: 8 }}>-</button>
                      <div style={{ minWidth: 28, textAlign: 'center' }}>{cart[id]?.qty || 0}</div>
                      <button onClick={() => inc(id, { name, price })} style={{ width: 34, height: 34, borderRadius: 8 }}>+</button>
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
                cartItems.map((it) => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #eee', paddingTop: 8, marginTop: 8 }}>
                  </div>
                ))
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
