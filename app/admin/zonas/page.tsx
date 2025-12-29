"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../../components/SideMenu";
import ActionsNav from "../../components/ActionsNav";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
import { loadZonas, createZona, updateZona, deleteZona, Zona } from "../../lib/zonas";

export default function ZonasPage() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string>("Listar");

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState<Zona | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editingZona, setEditingZona] = useState<Zona | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>("");

  useEffect(() => { let cancelled = false; async function f(){ setLoading(true); setError(null); const r = await loadZonas(); if (cancelled) return; if (!r.ok) { setZonas([]); setError(`Error ${r.status}`); } else { setZonas(r.zonas || []); } setLoading(false);} f(); return () => { cancelled = true; }; }, []);

  const reload = async () => {
    setLoading(true); setError(null);
    try { const r = await loadZonas(); if (!r.ok) { setZonas([]); setError((r as any).data?.message ?? `Error ${r.status}`); } else setZonas(r.zonas || []); } catch (err: any) { setZonas([]); setError(err?.message ?? String(err)); }
    setLoading(false);
  };

  async function handleCreate() {
    if (!nombre && !codigo) { setModalMessage('Ingresa código o nombre'); setModalOpen(true); return; }
    const payload: any = { codigo: codigo || undefined, nombre: nombre || undefined };
    setLoading(true);
    try {
      const res = await createZona(payload);
      if (!res.ok) {
        console.error('zonas create error', res);
        const serverObj = (res as any)?.data ?? null;
        const serverMsg = serverObj?.message || serverObj?.msg || null;
        const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
        const msg = serverDetail ? `No se pudo crear la zona: ${serverDetail}` : (serverMsg ? `No se pudo crear la zona: ${serverMsg}` : `Error al crear (status ${res.status}).`);
        setModalMessage(msg);
        setModalOpen(true);
      } else {
        setCodigo(''); setNombre(''); setActive('Listar');
        await reload();
      }
    } catch (err: any) { setModalMessage(err?.message ?? String(err)); setModalOpen(true); }
    setLoading(false);
  }

  function beginEdit(z: Zona) {
    setEditingZona(z);
    setCodigo(String(z.codigo ?? ''));
    setNombre(String(z.nombre ?? ''));
    setShowEdit(true);
  }

  async function handleUpdate() {
    if (!editingZona) return;
    const id = editingZona.zona_id ?? editingZona.id;
    const payload: any = { codigo: codigo || undefined, nombre: nombre || undefined };
    setLoading(true);
    try {
      const res = await updateZona(id as any, payload);
      if (!res.ok) {
        console.error('zonas update error', res);
        const serverObj = (res as any)?.data ?? null;
        const serverMsg = serverObj?.message || serverObj?.msg || null;
        const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
        const msg = serverDetail ? `No se pudo modificar la zona: ${serverDetail}` : (serverMsg ? `No se pudo modificar la zona: ${serverMsg}` : `Error al modificar (status ${res.status}).`);
        setModalMessage(msg);
        setModalOpen(true);
      } else { await reload(); setShowEdit(false); setEditingZona(null); }
    } catch (err: any) { setModalMessage(err?.message ?? String(err)); setModalOpen(true); }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: '#fff' }}>
          <h2 style={{ color: '#25abb9', marginTop: 0, fontWeight: 'bold' }}>ZONAS</h2>
          <div style={{ marginTop: 12 }}>
            <ActionsNav active={active} onChange={(a) => setActive(a)} />

            {active === 'Crear' && (
              <div style={{ padding: 12, border: '1px solid #e6f7f6', borderRadius: 8, maxWidth: 720 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Crear zona</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder='Código' style={{ padding: 12, borderRadius: 12, border: '2px solid #19A7A6', background: 'rgba(25,167,166,0.03)' }} />
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder='Nombre' style={{ padding: 12, borderRadius: 12, border: '2px solid #19A7A6', background: 'rgba(25,167,166,0.03)' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCreate} style={{ padding: '10px 14px', background: '#19A7A6', color: 'white', borderRadius: 8 }}>Crear zona</button>
                  </div>
                </div>
              </div>
            )}

            {active === 'Modificar' && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Modificar zonas</h3>
                {loading && <p>Cargando zonas...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>CÓDIGO</div>
                      <div style={{ flex: 3, padding: '10px 12px' }}>NOMBRE</div>
                      <div style={{ width: 140, padding: '10px 12px', textAlign: 'center' }}>ACCIONES</div>
                    </div>
                    <div>
                      {(!zonas || zonas.length === 0) ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron zonas.</div>
                      ) : (
                        zonas.map((z) => (
                          <div key={String(z.zona_id ?? z.id ?? z.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{z.codigo ?? ''}</div>
                            <div style={{ flex: 3, padding: '10px 12px' }}>{z.nombre ?? ''}</div>
                            <div style={{ width: 140, padding: '10px 12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => beginEdit(z)} aria-label={`Modificar ${z.nombre}`} title={`Modificar ${z.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#19A7A6', color: 'white', cursor: 'pointer' }}>
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

            {active === 'Listar' && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Lista de zonas</h3>
                {loading && <p>Cargando zonas...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>CÓDIGO</div>
                      <div style={{ flex: 3, padding: '10px 12px' }}>NOMBRE</div>
                    </div>
                    <div>
                      {zonas.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron zonas.</div>
                      ) : (
                        zonas.map((z) => (
                          <div key={String(z.zona_id ?? z.id ?? z.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{z.codigo ?? ''}</div>
                            <div style={{ flex: 3, padding: '10px 12px' }}>{z.nombre ?? ''}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'Eliminar' && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Eliminar zonas</h3>
                {loading && <p>Cargando zonas...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>CÓDIGO</div>
                      <div style={{ flex: 3, padding: '10px 12px' }}>NOMBRE</div>
                      <div style={{ width: 140, padding: '10px 12px', textAlign: 'center' }}>ACCIONES</div>
                    </div>
                    <div>
                      {zonas.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron zonas.</div>
                      ) : (
                        zonas.map((z) => (
                          <div key={String(z.zona_id ?? z.id ?? z.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{z.codigo ?? ''}</div>
                            <div style={{ flex: 3, padding: '10px 12px' }}>{z.nombre ?? ''}</div>
                            <div style={{ width: 140, padding: '10px 12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => { setToDelete(z); setShowConfirm(true); }} aria-label={`Eliminar ${z.nombre}`} title={`Eliminar ${z.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #e74c3c', background: '#ff6b6b', color: 'white', cursor: 'pointer' }}>
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

            <ConfirmModal open={showConfirm} title={toDelete ? `Eliminar zona: ${toDelete.nombre}` : 'Eliminar zona'} message={toDelete ? <span>¿Deseas eliminar la zona <strong>{toDelete.nombre}</strong>? Esta acción no se puede deshacer.</span> : '¿Deseas eliminar esta zona?'} confirmLabel='Eliminar' cancelLabel='Cancelar' loading={false} onCancel={() => { setShowConfirm(false); setToDelete(null); }} onConfirm={async () => {
              if (!toDelete) return; const id = toDelete.zona_id ?? toDelete.id ?? null; if (!id) return;
              try {
                const res = await deleteZona(id as any);
                if (!res.ok) {
                  const serverObj = (res as any)?.data ?? null;
                  const serverMsg = serverObj?.message || serverObj?.msg || null;
                  const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
                  let msg = 'No se pudo eliminar la zona.';
                  if (serverDetail && typeof serverDetail === 'string') msg = `No se puede eliminar porque está vinculado: ${serverDetail}`;
                  else if (serverMsg && typeof serverMsg === 'string') msg = `No se pudo eliminar: ${serverMsg}`;
                  else msg = `No se pudo eliminar la zona (status ${res.status}).`;
                  setModalMessage(msg);
                  setModalOpen(true);
                } else {
                  await reload();
                }
              } catch (err: any) {
                setModalMessage(err?.message ?? String(err));
                setModalOpen(true);
              }
              setShowConfirm(false); setToDelete(null);
            }} />
            <AlertModal open={modalOpen} title="Error" message={modalMessage} onClose={() => setModalOpen(false)} />

            {showEdit && editingZona && (
              <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ width: 540, maxWidth: '94%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
                  <h3 style={{ marginTop: 0, color: '#0b7285' }}>Editar zona</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder='Código' style={{ padding: 12, borderRadius: 12, border: '1px solid #ddd' }} />
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder='Nombre' style={{ padding: 12, borderRadius: 12, border: '1px solid #ddd' }} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowEdit(false); setEditingZona(null); }} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5d9', background: 'white' }}>Cancelar</button>
                      <button onClick={handleUpdate} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#19A7A6', color: 'white' }}>Guardar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
