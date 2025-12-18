"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export default function ConfirmModal({ open, title = "Confirmar", message = "¿Seguro?", confirmLabel = "Confirmar", cancelLabel = "Cancelar", loading = false, onConfirm, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") {
        // ignore Enter when loading
        if (!loading) onConfirm();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onConfirm, onCancel]);

  useEffect(() => {
    if (open) {
      // focus cancel by default so accidental Enter doesn't confirm
      setTimeout(() => cancelRef.current?.focus(), 0);
      // prevent background scroll
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div ref={overlayRef} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} aria-modal="true" role="dialog">
      <div style={{ width: 480, maxWidth: "94%", background: "white", borderRadius: 12, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", outline: "none" }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: "#0b7285" }}>{title}</h3>
        </div>
        <div style={{ marginBottom: 20, color: "#333" }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button ref={cancelRef} onClick={onCancel} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5d9", background: "white", color: "#333", cursor: "pointer" }} disabled={loading}>
            {cancelLabel}
          </button>
          <button onClick={() => onConfirm()} style={{ padding: "10px 14px", borderRadius: 8, border: "none", color: "white", background: "linear-gradient(90deg,#ff6b6b, #ff4c4c)", cursor: "pointer" }} disabled={loading}>
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
