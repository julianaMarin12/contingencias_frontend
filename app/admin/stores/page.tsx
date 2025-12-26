"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../../components/SideMenu";
import ActionsNav from "../../components/ActionsNav";
import ConfirmModal from "../../components/ConfirmModal";
import StoreEditModal from "../../components/StoreEditModal";
import { loadStores, createStore, updateStore, deleteStore, Store } from "../../lib/stores";
import { loadUsers, User } from "../../lib/users";
import { loadZonas, Zona, getZonaNombre } from "../../lib/zonas";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState<Store | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [active, setActive] = useState<string>("Listar");

  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [usuarioId, setUsuarioId] = useState<number | undefined>(undefined);
  const [zonaId, setZonaId] = useState<number | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  
  function getUsuarioDisplay(s: Store) {
    const uidRaw = s.usuario_id ?? s.usuarioId ?? null;
    if (uidRaw === null || typeof uidRaw === 'undefined' || uidRaw === '') return '';
    const uidNum = Number(uidRaw);
    const u = users.find((x) => Number(x.usuario_id ?? 0) === uidNum);
    return u ? (u.nombre ?? u.email ?? String(uidNum)) : String(uidNum);
  }
  const [zonaNames, setZonaNames] = useState<Record<string, string>>({});

  useEffect(() => { let cancelled = false; async function f(){ setLoading(true); setError(null);
    const storedUid = (typeof window !== 'undefined') ? (localStorage.getItem('userId') ?? localStorage.getItem('usuario_id') ?? localStorage.getItem('id')) : null;
    const uid = storedUid ? Number(storedUid) : undefined;
    const r = await loadStores(uid);
    if (cancelled) return; if (!r.ok) { setStores([]); setError(`Error ${r.status}`); } else {
        const data = r.data;
        let arr: any[] = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data?.data)) arr = data.data;
        else if (data && typeof data === 'object') {
          if (Array.isArray((data as any).tiendas)) arr = (data as any).tiendas;
          else {
            const vals = Object.values(data || {});
            if (vals.every((v) => Array.isArray(v))) arr = vals.flat();
          }
        }
        setStores(arr as Store[]);
      } setLoading(false);} f(); return () => { cancelled = true; }; }, []);


      useEffect(() => {
        let cancelled = false;
        async function loadOptions() {
          try {
            const u = await loadUsers(); if (!cancelled && u.ok) setUsers(u.users || []);
          } catch (e) {}
          try {
            const z = await loadZonas();
            if (!cancelled && z.ok) setZonas(z.zonas || []);
          } catch (e) {}
        }
        loadOptions();
        return () => { cancelled = true; };
      }, []);

    useEffect(() => {
      let cancelled = false;
      async function ensureNames() {
        try {
          const missing: Set<string> = new Set();
          for (const s of stores) {
            const z = (s as any).zona;
            if (!z) continue;
            if (typeof z === 'object') continue;
            const zid = String(z);
            const foundLocal = zonas.find((zz) => String(zz.zona_id ?? zz.id) === zid);
            if (foundLocal) continue;
            if (zonaNames[zid]) continue;
            missing.add(zid);
          }
          if (missing.size === 0) return;
          const updates: Record<string, string> = {};
          for (const id of Array.from(missing)) {
            if (cancelled) break;
            try {
              const name = await getZonaNombre(id);
              if (name) updates[id] = name;
            } catch (e) {}
          }
          if (!cancelled && Object.keys(updates).length) setZonaNames((p) => ({ ...p, ...updates }));
        } catch (e) {}
      }
      ensureNames();
      return () => { cancelled = true; };
    }, [stores, zonas]);

    function getZonaDisplay(s: Store) {
      const raw = (s as any).zona;
      if (!raw && raw !== 0) return '';
      if (typeof raw === 'object') return raw.nombre ?? raw.codigo ?? JSON.stringify(raw);
      const zid = String(raw);
      const local = zonas.find((zz) => String(zz.zona_id ?? zz.id) === zid);
      if (local) return local.nombre ?? local.codigo ?? zid;
      if (zonaNames[zid]) return zonaNames[zid];
      return zid;
    }

  const reload = async () => {
    setLoading(true); setError(null);
    try {
      const storedUid = (typeof window !== 'undefined') ? (localStorage.getItem('userId') ?? localStorage.getItem('usuario_id') ?? localStorage.getItem('id')) : null;
      const uid = storedUid ? Number(storedUid) : undefined;
      const r = await loadStores(uid);
      if (!r.ok) { setStores([]); setError((r as any).data?.message ?? `Error ${r.status}`); }
      else {
        const data = r.data;
        let arr: any[] = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data?.data)) arr = data.data;
        else if (data && typeof data === 'object') {
          if (Array.isArray((data as any).tiendas)) arr = (data as any).tiendas;
          else {
            const vals = Object.values(data || {});
            if (vals.every((v) => Array.isArray(v))) arr = vals.flat();
          }
        }
        setStores(arr as Store[]);
      }
    } catch (err: any) { setStores([]); setError(err?.message ?? String(err)); }
    setLoading(false);
  };

  async function handleCreate() {
    const payload: any = { nombre, ciudad, direccion };
    if (typeof usuarioId !== 'undefined') payload.usuario_id = usuarioId;
    if (typeof zonaId !== 'undefined') payload.zona_id = zonaId;
    setLoading(true);
    try {
      const res = await createStore(payload);
      if (!res.ok) {
        alert(`Error al crear: ${res.status}`);
      } else {
        setNombre('');
        setCiudad('');
        setDireccion('');
        setUsuarioId(undefined);
        setZonaId(undefined);
        setActive('Listar');
        await reload();
      }
    } catch (err: any) { alert(err?.message ?? String(err)); }
    setLoading(false);
  }

  function beginEdit(s: Store) {
    setEditingStore(s);
    setNombre(s.nombre ?? s.name ?? '');
    setCiudad(s.ciudad ?? '');
    setDireccion(s.direccion ?? '');
    setUsuarioId(s.usuario_id ?? s.usuarioId ?? undefined);
    const z = (s as any).zona;
    if (z && typeof z === 'object') setZonaId(z.zona_id ?? z.id ?? undefined);
    else if (typeof z === 'number' || typeof z === 'string') setZonaId(Number(z));
    else setZonaId(undefined);
    setShowEdit(true);
  }

  async function handleUpdate() {
    if (!editingStore) return;
    const id = editingStore.tienda_id ?? editingStore.id;
    const payload: any = { nombre, ciudad, direccion };
    if (typeof usuarioId !== 'undefined') payload.usuario_id = usuarioId;
    if (typeof zonaId !== 'undefined') payload.zona_id = zonaId;
    setLoading(true);
    try {
      const res = await updateStore(id as any, payload);
      if (!res.ok) alert(`Error al modificar: ${res.status}`);
      else { await reload(); setShowEdit(false); setEditingStore(null); }
    } catch (err: any) { alert(err?.message ?? String(err)); }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: "#fff" }}>
          <h2 style={{ color: "#25abb9", marginTop: 0, fontWeight: "bold" }}>TIENDAS</h2>

          <div style={{ marginTop: 12 }}>
            <ActionsNav active={active} onChange={(a) => setActive(a)} />

            {active === "Crear" && (
              <div style={{ padding: 12, border: "1px solid #e6f7f6", borderRadius: 8, maxWidth: 720 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Crear tienda</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: 'rgba(25,167,166,0.03)' }} />
                  <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad" style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: 'rgba(25,167,166,0.03)' }} />
                  <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: 'rgba(25,167,166,0.03)' }} />
                  <select value={usuarioId ?? ''} onChange={(e) => setUsuarioId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: 'rgba(25,167,166,0.03)' }}>
                    <option value="">-- Seleccionar usuario --</option>
                    {users.map((u) => (
                      <option key={String(u.usuario_id ?? u.email)} value={u.usuario_id ?? ''}>{u.nombre ?? u.email}</option>
                    ))}
                  </select>

                  <select value={zonaId ?? ''} onChange={(e) => setZonaId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: 'rgba(25,167,166,0.03)' }}>
                    <option value="">-- Seleccionar zona --</option>
                    {zonas.map((z) => (
                      <option key={String(z.zona_id ?? z.id ?? z.codigo)} value={z.zona_id ?? z.id}>{z.nombre ?? z.codigo}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCreate} style={{ padding: '10px 14px', background: '#19A7A6', color: 'white', borderRadius: 8 }}>Crear tienda</button>
                  </div>
                </div>
              </div>
            )}

            {active === "Modificar" && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Modificar tiendas</h3>
                {loading && <p>Cargando tiendas...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>CIUDAD</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>DIRECCIÓN</div>
                      <div style={{ width: 120, padding: "10px 12px" }}>USUARIO</div>
                      <div style={{ width: 120, padding: "10px 12px" }}>ZONA</div>
                      <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                    </div>
                    <div>
                      {(!stores || stores.length === 0) ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron tiendas.</div>
                      ) : (
                        stores.map((s) => (
                          <div key={String(s.tienda_id ?? s.id ?? s.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: "center" }}>
                            <div style={{ flex: 2, padding: "10px 12px", color: "#19A7A6" }}>{s.nombre ?? s.name}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{s.ciudad ?? ''}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{s.direccion ?? ''}</div>
                            <div style={{ width: 120, padding: "10px 12px" }}>{getUsuarioDisplay(s)}</div>
                            <div style={{ width: 120, padding: "10px 12px" }}>{getZonaDisplay(s)}</div>
                            <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => beginEdit(s)} aria-label={`Modificar ${s.nombre}`} title={`Modificar ${s.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#19A7A6', color: 'white', cursor: 'pointer' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M3 21v-3.75L14.81 5.44a2 2 0 0 1 2.83 0l1.92 1.92a2 2 0 0 1 0 2.83L8.75 21H3z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                  <path d="M14.5 6.5l3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === "Listar" && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Lista de tiendas</h3>
                {loading && <p>Cargando tiendas...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>CIUDAD</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>DIRECCIÓN</div>
                      <div style={{ width: 120, padding: "10px 12px" }}>USUARIO</div>
                      <div style={{ width: 120, padding: "10px 12px" }}>ZONA</div>
                    </div>
                    <div>
                      {stores.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron tiendas.</div>
                      ) : (
                        stores.map((s) => (
                          <div key={String(s.tienda_id ?? s.id ?? s.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: "center" }}>
                            <div style={{ flex: 2, padding: "10px 12px", color: "#19A7A6" }}>{s.nombre ?? s.name}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{s.ciudad ?? ''}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{s.direccion ?? ''}</div>
                            <div style={{ width: 120, padding: "10px 12px" }}>{getUsuarioDisplay(s)}</div>
                            <div style={{ width: 120, padding: "10px 12px" }}>{getZonaDisplay(s)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === "Eliminar" && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Eliminar tiendas</h3>
                {loading && <p>Cargando tiendas...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>CIUDAD</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>DIRECCIÓN</div>
                      <div style={{ width: 120, padding: "10px 12px" }}>USUARIO</div>
                      <div style={{ width: 120, padding: "10px 12px" }}>ZONA</div>
                      <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                    </div>
                    <div>
                      {stores.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron tiendas.</div>
                      ) : (
                        stores.map((s) => (
                          <div key={String(s.tienda_id ?? s.id ?? s.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: "center" }}>
                            <div style={{ flex: 2, padding: "10px 12px", color: "#19A7A6" }}>{s.nombre ?? s.name}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{s.ciudad ?? ''}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{s.direccion ?? ''}</div>
                            <div style={{ width: 120, padding: "10px 12px" }}>{getUsuarioDisplay(s)}</div>
                            <div style={{ width: 120, padding: "10px 12px" }}>{getZonaDisplay(s)}</div>
                            <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => { setToDelete(s); setShowConfirm(true); }} aria-label={`Eliminar ${s.nombre}`} title={`Eliminar ${s.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #e74c3c', background: '#ff6b6b', color: 'white', cursor: 'pointer' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M3 6h18" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M8 6v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 11v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 11v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M9 3h6l-1 3H10L9 3z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <ConfirmModal open={showConfirm} title={toDelete ? `Eliminar tienda: ${toDelete.nombre}` : "Eliminar tienda"} message={toDelete ? <span>¿Deseas eliminar la tienda <strong>{toDelete.nombre}</strong>? Esta acción no se puede deshacer.</span> : "¿Deseas eliminar esta tienda?"} confirmLabel="Eliminar" cancelLabel="Cancelar" loading={false} onCancel={() => { setShowConfirm(false); setToDelete(null); }} onConfirm={async () => {
              if (!toDelete) return; const id = toDelete.tienda_id ?? toDelete.id ?? null; if (!id) return; try { const res = await deleteStore(id as any); if (!res.ok) alert(`Error al eliminar: ${res.status}`); else await reload(); } catch (err: any) { alert(err?.message ?? String(err)); } setShowConfirm(false); setToDelete(null);
            }} />

            {showEdit && editingStore && (
              <StoreEditModal open={showEdit} title={`Editar tienda: ${editingStore.nombre ?? editingStore.name ?? ''}`} nombre={nombre} ciudad={ciudad} direccion={direccion} usuarioId={usuarioId} zonaId={zonaId} users={users} zonas={zonas} loading={loading} onCancel={() => { setShowEdit(false); setEditingStore(null); }} onConfirm={async (payload) => { try { setLoading(true); const id = editingStore.tienda_id ?? editingStore.id; const res = await updateStore(id as any, payload); if (!res.ok) alert(`Error al modificar: ${res.status}`); else { await reload(); setShowEdit(false); setEditingStore(null); } } catch (err: any) { alert(err?.message ?? String(err)); } finally { setLoading(false); } }} />
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
