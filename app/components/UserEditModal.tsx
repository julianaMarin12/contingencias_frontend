"use client";
import React, { useEffect, useRef, useState } from "react";
import { Role, loadRoles } from "../lib/roles";

type Props = {
  open: boolean;
  title?: string;
  nombre?: string | null;
  email?: string | null;
  rolId?: number | null;
  loading?: boolean;
  showPassword?: boolean;
  onCancel: () => void;
  onConfirm: (nombre: string, email: string, rol_id?: number | undefined, password?: string | undefined) => Promise<void> | void;
};

export default function UserEditModal({ open, title = "Editar usuario", nombre, email, rolId, loading = false, showPassword = false, onCancel, onConfirm }: Props) {
  const [localNombre, setLocalNombre] = useState(nombre ?? "");
  const [localEmail, setLocalEmail] = useState(email ?? "");
  const [localRol, setLocalRol] = useState<number | undefined>(rolId ?? undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setLocalNombre(nombre ?? "");
    setLocalEmail(email ?? "");
    setLocalRol(rolId ?? undefined);
    setPassword("");
    setConfirmPassword("");
  }, [nombre, email, rolId, open]);

  useEffect(() => {
    let cancelled = false;
    async function fetchRoles() {
      const r = await loadRoles();
      if (cancelled) return;
      if (r.ok) setRoles(r.roles as Role[]);
    }
    fetchRoles();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} role="dialog" aria-modal aria-label={title}>
      <div style={{ width: 520, maxWidth: "94%", background: "white", borderRadius: 12, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <h3 style={{ margin: 0, color: "#0b7285" }}>{title}</h3>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={localNombre} onChange={(e) => setLocalNombre(e.target.value)} placeholder="Usuario" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
          <input value={localEmail} onChange={(e) => setLocalEmail(e.target.value)} placeholder="Email" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#19A7A6", marginLeft: 4 }}>Seleccionar Rol</label>
            <select value={localRol ?? ""} onChange={(e) => setLocalRol(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 12, borderRadius: 12, border: "2px solid #19A7A6", background: "white" }}>
              <option value="">-- Seleccionar rol --</option>
              {roles.map((r) => (
                <option key={String(r.rol_id)} value={r.rol_id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          {showPassword && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Contraseña" style={{ padding: 16, borderRadius: 12, border: "2px solid #19A7A6", background: "rgba(25,167,166,0.08)", outline: "none" }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button ref={cancelRef} onClick={onCancel} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5d9", background: "white", cursor: "pointer" }}>Cancelar</button>
          <button onClick={async () => {
            if (showPassword && password !== confirmPassword) { alert('Las contraseñas no coinciden'); return; }
            await onConfirm(localNombre, localEmail, localRol, showPassword ? password : undefined);
          }} disabled={loading || !localNombre || !localEmail || (showPassword && !password)} style={{ padding: "8px 12px", borderRadius: 8, border: "none", color: "white", background: "linear-gradient(90deg,#25ABB9 0%, #19A7A6 100%)", cursor: "pointer" }}>{loading ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}
