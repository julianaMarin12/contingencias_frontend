"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideMenu from "../components/SideMenu";
import ActionsNav, { Role } from "../components/ActionsNav";
import { loadRoles, createRole, updateRole, deleteRole } from "../lib/roles";
import ConfirmModal from "../components/ConfirmModal";
import EditModal from "../components/EditModal";

export default function Page() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string>("Listar");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [modifyLoading, setModifyLoading] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      const res = await loadRoles();
      if (cancelled) return;
      if (!res.ok) {
        setRoles([]);
        setError(res.error ?? `Error ${res.status}`);
      } else {
        setRoles(res.roles);
      }
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true };
  }, []);

  const router = useRouter();

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem("access_token");
    } catch {}
    router.push("/");
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: "#ffffff", minHeight: "80vh" }}>
          <h2 style={{ color: "#19A7A6", marginTop: 0, fontWeight: "bold" }}>ADMINISTRADOR</h2>
          <div style={{ marginTop: 12 }}>
            <ActionsNav active={active} onChange={(a) => setActive(a)} />

            <div style={{ marginTop: 12 }}>
              {active === "Crear" && (
                <div style={{ padding: 12, border: "1px solid #e6f7f6", borderRadius: 8, maxWidth: 520 }}>
                  <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Crear rol</h3>
                  {createError && <div style={{ color: "red", marginBottom: 8 }}>{createError}</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre"
                      style={{
                        width: "100%",
                        padding: "18px 16px",
                        borderRadius: 12,
                        border: "2px solid #25ABB9",
                        background: "#dff3f4",
                        color: "#0b6666",
                        boxSizing: "border-box",
                      }}
                    />
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Descripción"
                      style={{
                        width: "100%",
                        minHeight: 110,
                        padding: "18px 16px",
                        borderRadius: 12,
                        border: "2px solid #25ABB9",
                        background: "#dff3f4",
                        color: "#0b6666",
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />

                    <button
                      disabled={createLoading}
                      onClick={async () => {
                        const payloadNombre = nombre;
                        const payloadDescripcion = descripcion;
                        setNombre("");
                        setDescripcion("");

                        setCreateLoading(true);
                        setCreateError(null);
                        try {
                          const res = await createRole(payloadNombre, payloadDescripcion);
                          if (!res.ok) {
                            setCreateError(`Error: ${res.status}`);
                          } else {
                            setLoading(true);
                            const r = await loadRoles();
                            if (r.ok) setRoles(r.roles);
                            setLoading(false);
                            setActive("Listar");
                          }
                        } catch (err: any) {
                          setCreateError(err?.message ?? String(err));
                        }
                        setCreateLoading(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        borderRadius: 12,
                        border: "none",
                        color: "white",
                        background: "linear-gradient(90deg,#25ABB9 0%, #19A7A6 100%)",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(37,171,185,0.18)",
                      }}
                    >
                      {createLoading ? "Creando..." : "Crear"}
                    </button>
                  </div>
                </div>
              )}

              {active === "Modificar" && (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Modificar roles</h3>
                  {loading && <p>Cargando roles...</p>}
                  {error && <p style={{ color: "red" }}>{error}</p>}
                  {!loading && !error && (
                    <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                        <div style={{ flex: 1, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                        <div style={{ flex: 1, padding: "10px 12px" }}>DESCRIPCIÓN</div>
                        <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                      </div>
                      <div>
                        {(!roles || roles.length === 0) ? (
                          <div style={{ padding: 12, color: "#666" }}>No se encontraron roles.</div>
                        ) : (
                          roles.map((r) => (
                            <div key={String(r.rol_id ?? r.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: 'center' }}>
                              <div style={{ flex: 1, padding: "10px 12px", color: "#19A7A6" }}>{r.nombre}</div>
                              <div style={{ flex: 1, padding: "10px 12px" }}>{r.descripcion}</div>
                              <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <button
                                  onClick={() => { setRoleToEdit(r); setShowEdit(true); }}
                                  aria-label={`Editar ${r.nombre}`}
                                  title={`Editar ${r.nombre}`}
                                  style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#19A7A6', color: 'white', cursor: 'pointer' }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M3 21v-3.75L14.06 6.19l3.75 3.75L6.75 21H3z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    <path d="M19.02 4.98a2.5 2.5 0 0 1 3.54 3.54L18.5 12.59" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
                  <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Roles</h3>
                  {loading && <p>Cargando roles...</p>}
                  {error && <p style={{ color: "red" }}>{error}</p>}
                  {!loading && !error && (
                    <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                        <div style={{ flex: 1, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                        <div style={{ flex: 1, padding: "10px 12px" }}>DESCRIPCIÓN</div>
                      </div>
                      <div>
                        {(!roles || roles.length === 0) ? (
                          <div style={{ padding: 12, color: "#666" }}>No se encontraron roles.</div>
                        ) : (
                          roles.map((r) => (
                            <div key={String(r.rol_id ?? r.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6" }}>
                              <div style={{ flex: 1, padding: "10px 12px", color: "#19A7A6" }}>{r.nombre}</div>
                              <div style={{ flex: 1, padding: "10px 12px" }}>{r.descripcion}</div>
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
                  <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Eliminar roles</h3>
                  {loading && <p>Cargando roles...</p>}
                  {error && <p style={{ color: "red" }}>{error}</p>}
                  {!loading && !error && (
                    <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                        <div style={{ flex: 1, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                        <div style={{ flex: 1, padding: "10px 12px" }}>DESCRIPCIÓN</div>
                        <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                      </div>
                      <div>
                        {(!roles || roles.length === 0) ? (
                          <div style={{ padding: 12, color: "#666" }}>No se encontraron roles.</div>
                        ) : (
                          roles.map((r) => (
                            <div key={String(r.rol_id ?? r.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: 'center' }}>
                              <div style={{ flex: 1, padding: "10px 12px", color: "#19A7A6" }}>{r.nombre}</div>
                              <div style={{ flex: 1, padding: "10px 12px" }}>{r.descripcion}</div>
                              <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                
                                <button
                                  onClick={() => {
                                    setRoleToDelete(r);
                                    setShowConfirm(true);
                                  }}
                                  aria-label={`Eliminar ${r.nombre}`}
                                  title={`Eliminar ${r.nombre}`}
                                  disabled={deletingIds.includes(Number(r.rol_id ?? 0))}
                                  style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #e74c3c', background: deletingIds.includes(Number(r.rol_id ?? 0)) ? '#f9d6d6' : '#ff6b6b', color: 'white', cursor: 'pointer' }}
                                >
                                  {deletingIds.includes(Number(r.rol_id ?? 0)) ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeDasharray="3 3"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/></circle></svg>
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                      <path d="M3 6h18" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M8 6v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M10 11v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M14 11v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M9 3h6l-1 3H10L9 3z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
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
              <ConfirmModal
                open={showConfirm}
                title={roleToDelete ? `Eliminar rol: ${roleToDelete.nombre}` : "Eliminar rol"}
                message={roleToDelete ? <span>¿Deseas eliminar el rol <strong>{roleToDelete.nombre}</strong>? Esta acción no se puede deshacer.</span> : "¿Deseas eliminar este rol?"}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                loading={false}
                onCancel={() => { setShowConfirm(false); setRoleToDelete(null); }}
                onConfirm={async () => {
                  if (!roleToDelete) return;
                  const id = roleToDelete.rol_id ?? null;
                  if (!id) return;
                  setDeletingIds((s) => [...s, Number(id)]);
                  try {
                    const res = await deleteRole(id);
                    if (!res.ok) {
                      alert(`Error al eliminar: ${res.status}`);
                    } else {
                      setLoading(true);
                      const rr = await loadRoles();
                      if (rr.ok) setRoles(rr.roles);
                      setLoading(false);
                    }
                  } catch (err: any) {
                    alert(err?.message ?? String(err));
                  }
                  setDeletingIds((s) => s.filter((x) => x !== Number(id)));
                  setShowConfirm(false);
                  setRoleToDelete(null);
                }}
              />
              <EditModal
                open={showEdit}
                nombre={roleToEdit?.nombre}
                descripcion={roleToEdit?.descripcion}
                title={roleToEdit ? `Editar rol: ${roleToEdit.nombre}` : "Editar rol"}
                loading={editLoading}
                onCancel={() => { setShowEdit(false); setRoleToEdit(null); setEditLoading(false); }}
                onConfirm={async (n, d) => {
                  if (!roleToEdit) return;
                  const id = roleToEdit.rol_id ?? null;
                  if (!id) return;
                  setEditLoading(true);
                  try {
                    const res = await updateRole(id, n, d);
                    if (!res.ok) {
                      alert(`Error al modificar: ${res.status}`);
                    } else {
                      setLoading(true);
                      const rr = await loadRoles();
                      if (rr.ok) setRoles(rr.roles);
                      setLoading(false);
                      setShowEdit(false);
                      setRoleToEdit(null);
                    }
                  } catch (err: any) {
                    alert(err?.message ?? String(err));
                  }
                  setEditLoading(false);
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
