"use client";
import React, { useEffect, useState } from 'react';
import SideMenu from '../../components/SideMenu';
import ActionsNav from '../../components/ActionsNav';
import productsApi, { Product } from '../../lib/products';
import zonasApi from '../../lib/zonas';

function IconUpload() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3v10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 10l5-5 5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [zonasMap, setZonasMap] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [active, setActive] = useState<string>('Listar');

  async function load() {
    setLoading(true);
    const res = await productsApi.listProducts();
    setLoading(false);
    // accept products from multiple shapes: res.products, res.data (array), res.data.productos, or object-indexed
    const fromApi: Product[] = (res.products && Array.isArray(res.products)) ? res.products as Product[] : [];
    if (fromApi.length) {
      setProducts(fromApi);
      return;
    }
    const d = res.data;
    if (Array.isArray(d)) { setProducts(d as Product[]); return; }
    if (d && Array.isArray((d as any).productos)) { setProducts((d as any).productos as Product[]); return; }
    if (d && typeof d === 'object') {
      const vals = Object.values(d || {});
      if (vals.length && vals.every(v => typeof v === 'object')) { setProducts(vals as Product[]); return; }
    }
    setMsg(res.data ? JSON.stringify(res.data) : 'Error cargando productos');
  }

  useEffect(() => { load(); }, []);

  async function loadZonas() {
    try {
      const res = await zonasApi.loadZonas();
      if (res && Array.isArray(res.zonas)) {
        const map: Record<string, string> = {};
        for (const z of res.zonas) {
          const id = z.zona_id ?? z.id ?? '';
          const key = String(id);
          map[key] = z.nombre ?? z.codigo ?? key;
        }
        setZonasMap(map);
      }
    } catch (err) { /* ignore */ }
  }

  useEffect(() => { loadZonas(); }, []);



  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setMsg('Selecciona un archivo'); return; }
    setLoading(true);
    setMsg(null);
    try {
      const res = await productsApi.createProductFile(file);
      setLoading(false);
      if (res.ok) {
        setMsg('Archivo subido correctamente. Productos actualizados.');
        setFile(null);
        await load();
        setActive('Listar');
      } else {
        const body = res.data ? (typeof res.data === 'string' ? res.data : JSON.stringify(res.data)) : `Error ${res.status}`;
        setMsg(`Error al subir: ${body}`);
      }
    } catch (err: any) { setLoading(false); setMsg(err?.message ?? String(err)); }
  }

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: '#fff' }}>
          <h2 style={{ color: '#25abb9', marginTop: 0, fontWeight: 'bold' }}>PRODUCTOS</h2>
          <div style={{ marginTop: 12 }}>
            <ActionsNav actions={['Listar','Crear']} active={active} onChange={(a) => setActive(a)} />

            
            {active === 'Crear' && (
              <div style={{ padding: 12, border: '1px solid #e6f7f6', borderRadius: 8, maxWidth: 720 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Subir producto (archivo)</h3>
                {msg && (
                  <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: msg.startsWith('Error') ? '#ffecec' : '#e6fffa', color: msg.startsWith('Error') ? '#9f3a38' : '#0b6b64' }}>{msg}</div>
                )}
                <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input disabled={loading} type="file" accept="*/*" onChange={ev => { const f = ev.target.files ? ev.target.files[0] : null; setFile(f); }} />
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button disabled={loading} type="submit" style={{ background: '#19A7A6', color: '#fff', borderRadius: 8, padding: '8px 12px', border: 'none' }}>
                      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><IconUpload/> {loading ? 'Subiendo...' : 'Subir'}</span>
                    </button>
                    <div style={{ color: '#666', fontSize: 13 }}>{file ? file.name : 'No hay archivo seleccionado'}</div>
                  </div>
                </form>
              </div>
            )}

            {active === 'Listar' && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Lista de productos</h3>
                {loading && <p>Cargando productos...</p>}
                {!loading && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>NOMBRE</div>
                      <div style={{ width: 120, padding: '10px 12px' }}>CÓDIGO</div>
                      <div style={{ width: 120, padding: '10px 12px' }}>ESTADO</div>
                      <div style={{ flex: 2, padding: '10px 12px' }}>PRECIOS</div>
                    </div>
                    <div>
                      {products.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No hay productos.</div>
                      ) : (
                        products.map((p) => (
                          <div key={String(p.producto_id ?? p.id ?? p.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{p.nombre}</div>
                            <div style={{ width: 120, padding: '10px 12px' }}>{(p as any).codigo ?? ''}</div>
                            <div style={{ width: 120, padding: '10px 12px' }}>{(p as any).estado ? 'Activo' : 'Inactivo'}</div>
                            <div style={{ flex: 2, padding: '10px 12px' }}>
                              {Array.isArray((p as any).precios) && (p as any).precios.length ? (
                                <ul style={{ margin: 0, paddingLeft: 12 }}>
                                  {(p as any).precios.map((pr: any, i: number) => (
                                    <li key={i} style={{ fontSize: 13 }}>
                                      {pr.precio} — zona: {zonasMap[String(pr.zona_id ?? pr.zona ?? '')] ?? (pr.zona_id ?? pr.zona ?? '-')} — {pr.estado ? 'Activo' : 'Inactivo'}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ color: '#666' }}>Sin precios</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
