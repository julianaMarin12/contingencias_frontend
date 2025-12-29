"use client";
import React, { useEffect, useRef, useState } from "react";
import AlertModal from "./AlertModal";

type Props = {
  open: boolean;
  nombre?: string;
  descripcion?: string;
  onCancel: () => void;
  onConfirm: (nombre: string, descripcion: string) => Promise<void> | void;
  loading?: boolean;
  title?: string;
};

export default function EditModal({ open, nombre = "", descripcion = "", onCancel, onConfirm, loading = false, title = "Editar" }: Props) {
  const [localNombre, setLocalNombre] = useState(nombre);
  const [localDesc, setLocalDesc] = useState(descripcion);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setLocalNombre(nombre);
    setLocalDesc(descripcion);
  }, [nombre, descripcion, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  function sanitizeText(s: any, max = 150) { try { return String(s ?? '').trim().replace(/[<>]/g,'').slice(0, max); } catch { return ''; } }
  const canSave = sanitizeText(localNombre).length > 0;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} role="dialog" aria-modal>
      <div style={{ width: 520, maxWidth: "94%", background: "white", borderRadius: 12, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <h3 style={{ margin: 0, color: "#0b7285" }}>{title}</h3>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={localNombre} onChange={(e) => setLocalNombre(e.target.value)} placeholder="Nombre" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
          <textarea value={localDesc} onChange={(e) => setLocalDesc(e.target.value)} placeholder="Descripción" style={{ padding: 12, borderRadius: 8, border: "1px solid #ddd", minHeight: 100, resize: 'vertical' }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button ref={cancelRef} onClick={onCancel} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5d9", background: "white", cursor: "pointer" }}>Cancelar</button>
          <button onClick={async () => { if (!canSave) { setModalMessage('El nombre es requerido'); setModalOpen(true); return; } await onConfirm(sanitizeText(localNombre), sanitizeText(localDesc, 1000)); }} disabled={loading || !canSave} style={{ padding: "8px 12px", borderRadius: 8, border: "none", color: "white", background: "linear-gradient(90deg,#25ABB9 0%, #19A7A6 100%)", cursor: "pointer" }}>{loading ? "Guardando..." : "Guardar"}</button>
        </div>
        <AlertModal open={modalOpen} title="Aviso" message={modalMessage} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  );
}
