"use client";
import React, { useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string | React.ReactNode;
  onClose: () => void;
};

export default function AlertModal({ open, title = "Aviso", message = "", onClose }: Props) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} aria-modal="true" role="dialog">
      <div style={{ width: 440, maxWidth: "94%", background: "white", borderRadius: 12, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", outline: "none" }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: "#0b7285" }}>{title}</h3>
        </div>
        <div style={{ marginBottom: 20, color: "#333" }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5d9", background: "white", color: "#333", cursor: "pointer" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
