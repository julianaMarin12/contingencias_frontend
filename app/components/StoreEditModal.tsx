"use client";
import React, { useEffect, useRef, useState } from "react";
import { User } from "../lib/users";
import { Zona } from "../lib/zonas";

type Props = {
  open: boolean;
  nombre?: string;
  ciudad?: string;
  direccion?: string;
  usuarioId?: number | undefined;
  zonaId?: number | undefined;
  users?: User[];
  zonas?: Zona[];
  loading?: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: (payload: { nombre: string; ciudad: string; direccion: string; usuario_id?: number; zona_id?: number }) => Promise<void> | void;
};

export default function StoreEditModal({ open, nombre = "", ciudad = "", direccion = "", usuarioId, zonaId, users = [], zonas = [], loading = false, title = "Editar tienda", onCancel, onConfirm }: Props) {
  const [localNombre, setLocalNombre] = useState(nombre);
  const [localCiudad, setLocalCiudad] = useState(ciudad);
  const [localDireccion, setLocalDireccion] = useState(direccion);
  const [localUsuarioId, setLocalUsuarioId] = useState<number | undefined>(usuarioId);
  const [localZonaId, setLocalZonaId] = useState<number | undefined>(zonaId);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setLocalNombre(nombre);
    setLocalCiudad(ciudad);
    setLocalDireccion(direccion);
    setLocalUsuarioId(usuarioId);
    setLocalZonaId(zonaId);
  }, [nombre, ciudad, direccion, usuarioId, zonaId, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  function sanitizeText(s: any, max = 200) { try { return String(s ?? '').trim().replace(/[<>]/g,'').slice(0, max); } catch { return ''; } }
  function sanitizeIdVal(v: any) { try { const s = String(v ?? '').trim(); return /^\d+$/.test(s) ? Number(s) : undefined; } catch { return undefined; } }
  const canSave = sanitizeText(localNombre).length > 0;

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} role="dialog" aria-modal>
      <div style={{ width: 640, maxWidth: "94%", background: "white", borderRadius: 12, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <h3 style={{ margin: 0, color: "#0b7285" }}>{title}</h3>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={localNombre} onChange={(e) => setLocalNombre(e.target.value)} placeholder="Nombre" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
          <input value={localCiudad} onChange={(e) => setLocalCiudad(e.target.value)} placeholder="Ciudad" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
          <input value={localDireccion} onChange={(e) => setLocalDireccion(e.target.value)} placeholder="Dirección" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
          <select value={localUsuarioId ?? ""} onChange={(e) => setLocalUsuarioId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}>
            <option value="">-- Seleccionar usuario --</option>
            {users.map((u) => (
              <option key={String(u.usuario_id ?? u.email)} value={u.usuario_id ?? ""}>{u.nombre ?? u.email}</option>
            ))}
          </select>

          <select value={localZonaId ?? ""} onChange={(e) => setLocalZonaId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }}>
            <option value="">-- Seleccionar zona --</option>
            {zonas.map((z) => (
              <option key={String(z.zona_id ?? z.id ?? z.codigo)} value={z.zona_id ?? z.id}>{z.nombre ?? z.codigo}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button ref={cancelRef} onClick={onCancel} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5d9", background: "white", cursor: "pointer" }}>Cancelar</button>
          <button onClick={async () => {
            if (!canSave) { alert('El nombre es requerido.'); return; }
            const payload = { nombre: sanitizeText(localNombre, 200), ciudad: sanitizeText(localCiudad, 200), direccion: sanitizeText(localDireccion, 400), usuario_id: sanitizeIdVal(localUsuarioId), zona_id: sanitizeIdVal(localZonaId) };
            await onConfirm(payload);
          }} disabled={loading || !canSave} style={{ padding: "8px 12px", borderRadius: 8, border: "none", color: "white", background: "linear-gradient(90deg,#25ABB9 0%, #19A7A6 100%)", cursor: "pointer" }}>{loading ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}
