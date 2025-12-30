"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../../components/SideMenu";
import ActionsNav from "../../components/ActionsNav";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
import ClientEditModal from "../../components/ClientEditModal";
import { loadClients, createClient, updateClient, deleteClient, Client } from "../../lib/clients";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string>('Listar');

  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState<string | number>('');
  const [correo, setCorreo] = useState('');
  const [empleado, setEmpleado] = useState<boolean>(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>("");
  const [cedulaSearch, setCedulaSearch] = useState<string>('');

  useEffect(() => { let cancelled = false; async function f(){ setLoading(true); setError(null); const r = await loadClients(); if (cancelled) return; if (!r.ok) { setClients([]); setError(`Error ${r.status}`); } else { setClients(r.clients || []); } setLoading(false);} f(); return () => { cancelled = true; }; }, []);

  const reload = async () => {
    setLoading(true); setError(null);
    try { const r = await loadClients(); if (!r.ok) { setClients([]); setError((r as any).data?.message ?? `Error ${r.status}`); } else setClients(r.clients || []); } catch (err: any) { setClients([]); setError(err?.message ?? String(err)); }
    setLoading(false);
  };

  async function handleCreate() {
    const cedulaNum = (typeof cedula === 'string' && cedula.trim() !== '' && !isNaN(Number(cedula))) ? Number(cedula) : (typeof cedula === 'number' ? cedula : undefined);
    const payload: any = { nombre, correo, Empleado: empleado };
    if (typeof cedulaNum !== 'undefined') payload.cedula = cedulaNum;
    else if (typeof cedula !== 'undefined' && cedula !== '') payload.cedula = cedula;
    setLoading(true);
    // client-side duplicate cedula validation
    try {
      if (typeof payload.cedula !== 'undefined' && payload.cedula !== '') {
        const exists = clients.find((c) => (c.cedula !== undefined) && String(c.cedula) === String(payload.cedula));
        if (exists) {
          setModalMessage(`La cédula ${payload.cedula} ya está registrada para el cliente: ${exists.nombre ?? exists.id}`);
          setModalOpen(true);
          setLoading(false);
          return;
        }
      }
      const res = await createClient(payload);
      if (!res.ok) {
        console.error('clientes create error', res);
        const serverObj = (res as any)?.data ?? null;
        const serverMsg = serverObj?.message || serverObj?.msg || null;
        const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
        const msg = serverDetail ? `No se pudo crear el cliente: ${serverDetail}` : (serverMsg ? `No se pudo crear el cliente: ${serverMsg}` : `Error al crear (status ${res.status}).`);
        setModalMessage(msg);
        setModalOpen(true);
      } else {
        setNombre(''); setCedula(''); setCorreo(''); setEmpleado(false); setActive('Listar');
        await reload();
      }
    } catch (err: any) { setModalMessage(err?.message ?? String(err)); setModalOpen(true); }
    // clear any previous modal on success
    if (modalOpen && !modalMessage) { /* nothing */ }
    setLoading(false);
  }

  const displayedClients = (() => {
    const q = String(cedulaSearch ?? '').trim();
    if (!q) return clients;
    return clients.filter((c) => String(c.cedula ?? '').startsWith(q));
  })();

  function beginEdit(c: Client) {
    setEditingClient(c);
    setNombre(c.nombre ?? '');
    setCedula(c.cedula ?? '');
    setCorreo(c.correo ?? '');
    setEmpleado(!!c.Empleado);
    setShowEdit(true);
  }

  async function handleUpdate() {
    if (!editingClient) return;
    const id = editingClient.cliente_id ?? editingClient.id;
    const payload: any = { nombre, correo, Empleado: empleado };
    setLoading(true);
    try {
      const res = await updateClient(id as any, payload);
      if (!res.ok) {
        console.error('clientes update error', res);
        const serverObj = (res as any)?.data ?? null;
        const serverMsg = serverObj?.message || serverObj?.msg || null;
        const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
        const msg = serverDetail ? `No se pudo modificar el cliente: ${serverDetail}` : (serverMsg ? `No se pudo modificar el cliente: ${serverMsg}` : `Error al modificar (status ${res.status}).`);
        setModalMessage(msg);
        setModalOpen(true);
      } else { await reload(); setShowEdit(false); setEditingClient(null); setModalOpen(false); setModalMessage(''); }
    } catch (err: any) { setModalMessage(err?.message ?? String(err)); setModalOpen(true); }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: '#fff' }}>
          <h2 style={{ color: '#25abb9', marginTop: 0, fontWeight: 'bold' }}>CLIENTES</h2>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <ActionsNav active={active} onChange={(a) => setActive(a)} />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  aria-label="Buscar por cédula"
                  placeholder='Buscar por cédula'
                  value={cedulaSearch}
                  onChange={(e) => setCedulaSearch(e.target.value)}
                  style={{ padding: 10, borderRadius: 12, border: '2px solid #19A7A6', background: 'rgba(25,167,166,0.03)', width: 220 }}
                />
                <button onClick={() => { /* keep client-side filter; button for discoverability */ }} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#19A7A6', color: 'white', cursor: 'pointer' }}>Buscar</button>
                <button onClick={() => setCedulaSearch('')} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5d9', background: 'white', cursor: 'pointer' }}>Limpiar</button>
              </div>
            </div>

            {active === 'Crear' && (
              <div style={{ padding: 12, border: '1px solid #e6f7f6', borderRadius: 8, maxWidth: 720 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Crear cliente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder='Nombre' style={{ padding: 12, borderRadius: 12, border: '2px solid #19A7A6', background: 'rgba(25,167,166,0.03)' }} />
                  <input value={String(cedula ?? '')} onChange={(e) => setCedula(e.target.value)} placeholder='Cédula' style={{ padding: 12, borderRadius: 12, border: '2px solid #19A7A6', background: 'rgba(25,167,166,0.03)' }} />
                  <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder='Correo' style={{ padding: 12, borderRadius: 12, border: '2px solid #19A7A6', background: 'rgba(25,167,166,0.03)' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type='checkbox' checked={empleado} onChange={(e) => setEmpleado(e.target.checked)} /> Empleado</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCreate} style={{ padding: '10px 14px', background: '#19A7A6', color: 'white', borderRadius: 8 }}>Crear cliente</button>
                  </div>
                </div>
              </div>
            )}

            {active === 'Modificar' && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Modificar clientes</h3>
                {loading && <p>Cargando clientes...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>NOMBRE</div>
                      <div style={{ width: 160, padding: '10px 12px' }}>CÉDULA</div>
                      <div style={{ flex: 2, padding: '10px 12px' }}>CORREO</div>
                      <div style={{ width: 120, padding: '10px 12px' }}>EMPLEADO</div>
                      <div style={{ width: 140, padding: '10px 12px', textAlign: 'center' }}>ACCIONES</div>
                    </div>
                    <div>
                      {(!displayedClients || displayedClients.length === 0) ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron clientes.</div>
                        ) : (
                          displayedClients.map((c) => (
                          <div key={String(c.cliente_id ?? c.id ?? c.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{c.nombre}</div>
                            <div style={{ width: 160, padding: '10px 12px' }}>{c.cedula ?? ''}</div>
                            <div style={{ flex: 2, padding: '10px 12px' }}>{c.correo ?? ''}</div>
                            <div style={{ width: 120, padding: '10px 12px' }}>{c.Empleado ? 'Sí' : 'No'}</div>
                            <div style={{ width: 140, padding: '10px 12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => beginEdit(c)} aria-label={`Modificar ${c.nombre}`} title={`Modificar ${c.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#19A7A6', color: 'white', cursor: 'pointer' }}>
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
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Lista de clientes</h3>
                {loading && <p>Cargando clientes...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>NOMBRE</div>
                      <div style={{ width: 160, padding: '10px 12px' }}>CÉDULA</div>
                      <div style={{ flex: 2, padding: '10px 12px' }}>CORREO</div>
                      <div style={{ width: 120, padding: '10px 12px' }}>EMPLEADO</div>
                    </div>
                    <div>
                      {displayedClients.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron clientes.</div>
                      ) : (
                        displayedClients.map((c) => (
                          <div key={String(c.cliente_id ?? c.id ?? c.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{c.nombre}</div>
                            <div style={{ width: 160, padding: '10px 12px' }}>{c.cedula ?? ''}</div>
                            <div style={{ flex: 2, padding: '10px 12px' }}>{c.correo ?? ''}</div>
                            <div style={{ width: 120, padding: '10px 12px' }}>{c.Empleado ? 'Sí' : 'No'}</div>
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
                <h3 style={{ margin: '8px 0', color: '#0b7285' }}>Eliminar clientes</h3>
                {loading && <p>Cargando clientes...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: '1px solid #b7e3e2', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#19A7A6', color: 'white', fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>NOMBRE</div>
                      <div style={{ width: 160, padding: '10px 12px' }}>CÉDULA</div>
                      <div style={{ flex: 2, padding: '10px 12px' }}>CORREO</div>
                      <div style={{ width: 120, padding: '10px 12px' }}>EMPLEADO</div>
                      <div style={{ width: 140, padding: '10px 12px', textAlign: 'center' }}>ACCIONES</div>
                    </div>
                    <div>
                      {displayedClients.length === 0 ? (
                        <div style={{ padding: 12, color: '#666' }}>No se encontraron clientes.</div>
                      ) : (
                        displayedClients.map((c) => (
                          <div key={String(c.cliente_id ?? c.id ?? c.nombre)} style={{ display: 'flex', borderTop: '1px solid #e6f7f6', alignItems: 'center' }}>
                            <div style={{ flex: 2, padding: '10px 12px', color: '#19A7A6' }}>{c.nombre}</div>
                            <div style={{ width: 160, padding: '10px 12px' }}>{c.cedula ?? ''}</div>
                            <div style={{ flex: 2, padding: '10px 12px' }}>{c.correo ?? ''}</div>
                            <div style={{ width: 120, padding: '10px 12px' }}>{c.Empleado ? 'Sí' : 'No'}</div>
                            <div style={{ width: 140, padding: '10px 12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => { setToDelete(c); setShowConfirm(true); }} aria-label={`Eliminar ${c.nombre}`} title={`Eliminar ${c.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #e74c3c', background: '#ff6b6b', color: 'white', cursor: 'pointer' }}>
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
            <ConfirmModal open={showConfirm} title={toDelete ? `Eliminar cliente: ${toDelete.nombre}` : 'Eliminar cliente'} message={toDelete ? <span>¿Deseas eliminar el cliente <strong>{toDelete.nombre}</strong>? Esta acción no se puede deshacer.</span> : '¿Deseas eliminar este cliente?'} confirmLabel='Eliminar' cancelLabel='Cancelar' loading={false} onCancel={() => { setShowConfirm(false); setToDelete(null); }} onConfirm={async () => {
              if (!toDelete) return; const id = toDelete.cliente_id ?? toDelete.id ?? null; if (!id) return;
              try {
                const res = await deleteClient(id as any);
                if (!res.ok) {
                  const serverObj = (res as any)?.data ?? null;
                  const serverMsg = serverObj?.message || serverObj?.msg || null;
                  const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
                  let msg = 'No se pudo eliminar el cliente.';
                  if (serverDetail && typeof serverDetail === 'string') msg = `No se puede eliminar porque está vinculado: ${serverDetail}`;
                  else if (serverMsg && typeof serverMsg === 'string') msg = `No se pudo eliminar: ${serverMsg}`;
                  else msg = `No se pudo eliminar el cliente (status ${res.status}).`;
                  setModalMessage(msg);
                  setModalOpen(true);
                } else {
                  await reload();
                  setModalOpen(false);
                  setModalMessage('');
                }
              } catch (err: any) {
                setModalMessage(err?.message ?? String(err));
                setModalOpen(true);
              }
              setShowConfirm(false); setToDelete(null);
            }} />
            <AlertModal open={modalOpen} title="Error" message={modalMessage} onClose={() => setModalOpen(false)} />

            {showEdit && editingClient && (
              <ClientEditModal
                open={showEdit}
                title={`Editar cliente: ${editingClient.nombre ?? ''}`}
                nombre={nombre}
                cedula={cedula}
                correo={correo}
                empleado={empleado}
                loading={loading}
                onCancel={() => { setShowEdit(false); setEditingClient(null); }}
                onConfirm={async (payload) => {
                  try {
                    setLoading(true);
                    const id = editingClient.cliente_id ?? editingClient.id;
                    const cedulaRaw = payload.cedula ?? '';
                    const cedulaNum = (typeof cedulaRaw === 'string' && cedulaRaw.trim() !== '' && !isNaN(Number(cedulaRaw))) ? Number(cedulaRaw) : (typeof cedulaRaw === 'number' ? cedulaRaw : undefined);
                    const out: any = { nombre: payload.nombre ?? '', correo: payload.correo ?? '' };
                    out.Empleado = typeof payload.Empleado !== 'undefined' ? payload.Empleado : empleado;

                    const res = await updateClient(id as any, out);
                    if (!res.ok) {
                      console.error('clientes update error', res);
                      
                      const serverObj = (res as any)?.data ?? null;
                      const serverMsg = serverObj?.message || serverObj?.msg || null;
                      const serverDetail = serverObj?.detail || (serverObj?.error && (serverObj.error.detail || serverObj.error.message)) || null;
                      const fallback = serverObj ? JSON.stringify(serverObj) : null;
                      const msg = serverDetail ? `No se pudo modificar el cliente: ${serverDetail}` : (serverMsg ? `No se pudo modificar el cliente: ${serverMsg}` : (fallback ? `Error al modificar: ${fallback}` : `Error al modificar (status ${res.status}).`));
                      setModalMessage(msg);
                      setModalOpen(true);
                    } else {
                      await reload();
                      setShowEdit(false);
                      setEditingClient(null);
                    }
                  } catch (err: any) {
                    setModalMessage(err?.message ?? String(err));
                    setModalOpen(true);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
