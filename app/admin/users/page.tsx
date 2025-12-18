"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../../components/SideMenu";
import ActionsNav from "../../components/ActionsNav";
import ConfirmModal from "../../components/ConfirmModal";
import UserEditModal from "../../components/UserEditModal";
import { loadUsers, User, deleteUser, updateUser, createUser } from "../../lib/users";
import { loadRoles } from "../../lib/roles";


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [active, setActive] = useState<string>("Listar");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rolesOptions, setRolesOptions] = useState<any[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined);

  useEffect(() => { let cancelled = false; async function f(){ setLoading(true); setError(null); const r = await loadUsers(); if (cancelled) return; if (!r.ok) { setUsers([]); setError(`Error ${r.status}`); } else setUsers(r.users); setLoading(false);} f(); return () => { cancelled = true; }; }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRolesOnce() {
      try {
        const r = await loadRoles();
        if (cancelled) return;
        if (r.ok) setRolesOptions(r.roles ?? []);
      } catch (err) {
        // ignore
      }
    }
    loadRolesOnce();
    return () => { cancelled = true; };
  }, []);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await loadUsers();
      if (!r.ok) {
        setUsers([]);
        setError(r.error ?? `Error ${r.status}`);
      } else {
        setUsers(r.users);
      }
    } catch (err: any) {
      setUsers([]);
      setError(err?.message ?? String(err));
    }
    setLoading(false);
  };

  // reload when switching to Listar
  useEffect(() => {
    if (active === "Listar") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: "#fff" }}>
          <h2 style={{ color: "#25abb9", marginTop: 0, fontWeight: "bold" }}>USUARIOS</h2>

          <div style={{ marginTop: 12 }}>
            <ActionsNav active={active} onChange={(a) => setActive(a)} />

            {active === "Crear" && (
              <div style={{ padding: 12, border: "1px solid #e6f7f6", borderRadius: 8, maxWidth: 640 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Crear usuario</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Usuario" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, color: "#19A7A6", marginLeft: 4 }}>Seleccionar Rol</label>
                    <select value={selectedRoleId ?? ""} onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: "white" }}>
                      <option value="">-- Seleccionar rol --</option>
                      {rolesOptions.map((r) => (
                        <option key={String(r.rol_id ?? r.id)} value={r.rol_id ?? r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Contraseña" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={async () => {
                      if (password !== confirmPassword) { alert('Las contraseñas no coinciden'); return; }
                      const n = nombre; const e = email; const rId = selectedRoleId;
                      setNombre(""); setEmail(""); setPassword(""); setConfirmPassword(""); setSelectedRoleId(undefined);
                      setLoading(true);
                      try {
                        const res = await createUser(n, e, rId, password);
                        if (!res.ok) alert(`Error al crear: ${res.status}`);
                        else { await reload(); setActive("Listar"); }
                      } catch (err: any) { alert(err?.message ?? String(err)); }
                      setLoading(false);
                    }} style={{ padding: "10px 14px", background: "#19A7A6", color: "white", borderRadius: 8 }}>Crear</button>
                  </div>
                </div>
              </div>
            )}

            {active === "Modificar" && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Modificar usuarios</h3>
                {loading && <p>Cargando usuarios...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>EMAIL</div>
                      <div style={{ width: 180, padding: "10px 12px" }}>CREADO</div>
                      <div style={{ flex: 1, padding: "10px 12px" }}>ROL</div>
                      <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                    </div>
                    <div>
                      {(!users || users.length === 0) ? (
                        <div style={{ padding: 12, color: "#666" }}>No se encontraron usuarios.</div>
                      ) : (
                        users.map((u) => (
                          <div key={String(u.usuario_id ?? u.email)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: "center" }}>
                            <div style={{ flex: 2, padding: "10px 12px", color: "#19A7A6" }}>{u.nombre}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{u.email}</div>
                            <div style={{ width: 180, padding: "10px 12px" }}>{u.creado_an ? new Date(u.creado_an).toLocaleString() : "-"}</div>
                            <div style={{ flex: 1, padding: "10px 12px" }}>{u.rol?.nombre ?? "-"}</div>
                            <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => { setEditingUser(u); setShowEdit(true); setCreateMode(false); }} aria-label={`Modificar ${u.nombre}`} title={`Modificar ${u.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: '#19A7A6', color: 'white', cursor: 'pointer' }}>
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
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Lista de usuarios</h3>
                {loading && <p>Cargando usuarios...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>EMAIL</div>
                      <div style={{ width: 180, padding: "10px 12px" }}>CREADO</div>
                      <div style={{ flex: 1, padding: "10px 12px" }}>ROL</div>
                      <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                    </div>
                    <div>
                      {(!users || users.length === 0) ? (
                        <div style={{ padding: 12, color: "#666" }}>No se encontraron usuarios.</div>
                      ) : (
                        users.map((u) => (
                          <div key={String(u.usuario_id ?? u.email)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: "center" }}>
                            <div style={{ flex: 2, padding: "10px 12px", color: "#19A7A6" }}>{u.nombre}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{u.email}</div>
                            <div style={{ width: 180, padding: "10px 12px" }}>{u.creado_an ? new Date(u.creado_an).toLocaleString() : "-"}</div>
                            <div style={{ flex: 1, padding: "10px 12px" }}>{u.rol?.nombre ?? "-"}</div>
                            <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <button onClick={() => { setToDelete(u); setShowConfirm(true); }} aria-label={`Eliminar ${u.nombre}`} title={`Eliminar ${u.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #e74c3c', background: '#ff6b6b', color: 'white', cursor: 'pointer' }}>
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

            {active === "Eliminar" && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Eliminar usuarios</h3>
                {loading && <p>Cargando usuarios...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}
                {!loading && !error && (
                  <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                      <div style={{ flex: 2, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                      <div style={{ flex: 2, padding: "10px 12px" }}>EMAIL</div>
                      <div style={{ width: 180, padding: "10px 12px" }}>CREADO</div>
                      <div style={{ flex: 1, padding: "10px 12px" }}>ROL</div>
                      <div style={{ width: 140, padding: "10px 12px", textAlign: "center" }}>ACCIONES</div>
                    </div>
                    <div>
                      {(!users || users.length === 0) ? (
                        <div style={{ padding: 12, color: "#666" }}>No se encontraron usuarios.</div>
                      ) : (
                        users.map((u) => (
                          <div key={String(u.usuario_id ?? u.email)} style={{ display: "flex", borderTop: "1px solid #e6f7f6", alignItems: "center" }}>
                            <div style={{ flex: 2, padding: "10px 12px", color: "#19A7A6" }}>{u.nombre}</div>
                            <div style={{ flex: 2, padding: "10px 12px" }}>{u.email}</div>
                            <div style={{ width: 180, padding: "10px 12px" }}>{u.creado_an ? new Date(u.creado_an).toLocaleString() : "-"}</div>
                            <div style={{ flex: 1, padding: "10px 12px" }}>{u.rol?.nombre ?? "-"}</div>
                            <div style={{ width: 140, padding: "10px 12px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <button onClick={() => { setToDelete(u); setShowConfirm(true); }} aria-label={`Eliminar ${u.nombre}`} title={`Eliminar ${u.nombre}`} style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #e74c3c', background: '#ff6b6b', color: 'white', cursor: 'pointer' }}>
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
          </div>

          <ConfirmModal open={showConfirm} title={toDelete ? `Eliminar usuario: ${toDelete.nombre}` : "Eliminar usuario"} message={toDelete ? <span>¿Deseas eliminar el usuario <strong>{toDelete.nombre}</strong>? Esta acción no se puede deshacer.</span> : "¿Deseas eliminar este usuario?"} confirmLabel="Eliminar" cancelLabel="Cancelar" loading={false} onCancel={() => { setShowConfirm(false); setToDelete(null); }} onConfirm={async () => {
            if (!toDelete) return; const id = toDelete.usuario_id ?? null; if (!id) return; try { const res = await deleteUser(id); if (!res.ok) alert(`Error al eliminar: ${res.status}`); else await reload(); } catch (err: any) { alert(err?.message ?? String(err)); } setShowConfirm(false); setToDelete(null);
          }} />

          <UserEditModal open={showEdit} title={createMode ? "Crear usuario" : editingUser ? `Editar usuario: ${editingUser.nombre}` : "Editar usuario"} nombre={editingUser?.nombre} email={editingUser?.email} rolId={editingUser?.rol?.rol_id} loading={editLoading} showPassword={createMode} onCancel={() => { setShowEdit(false); setEditingUser(null); setEditLoading(false); setCreateMode(false); }} onConfirm={async (n, e, r, password) => {
            setEditLoading(true);
            try {
              if (createMode) {
                const res = await createUser(n, e, r, password);
                if (!res.ok) alert(`Error al crear: ${res.status}`);
                else await reload();
              } else {
                const id = editingUser?.usuario_id ?? null; if (!id) { alert('ID faltante'); setEditLoading(false); return; }
                const res = await updateUser(id, n, e, r, password);
                if (!res.ok) alert(`Error al modificar: ${res.status}`);
                else await reload();
              }
            } catch (err: any) { alert(err?.message ?? String(err)); }
            setEditLoading(false); setShowEdit(false); setEditingUser(null); setCreateMode(false);
          }} />

        </div>
      </main>
    </div>
  );
}
