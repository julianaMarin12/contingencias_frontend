"use client";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  nombre?: string;
  cedula?: string | number;
  correo?: string;
  empleado?: boolean;
  title?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (payload: { nombre: string; cedula?: string | number; correo?: string; Empleado?: boolean }) => Promise<void> | void;
};

export default function ClientEditModal({ open, nombre = "", cedula = "", correo = "", empleado = false, title = "Editar cliente", loading = false, onCancel, onConfirm }: Props) {
  const [localNombre, setLocalNombre] = useState(nombre);
  const [localCedula, setLocalCedula] = useState<string | number | undefined>(cedula ?? undefined);
  const [localCorreo, setLocalCorreo] = useState(correo);
  const [localEmpleado, setLocalEmpleado] = useState<boolean>(!!empleado);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setLocalNombre(nombre);
    setLocalCedula(cedula ?? undefined);
    setLocalCorreo(correo ?? "");
    setLocalEmpleado(!!empleado);
  }, [nombre, cedula, correo, empleado, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  function sanitizeText(s: any, max = 200) {
    try { return String(s ?? "").trim().replace(/[<>]/g, '').slice(0, max); } catch { return ''; }
  }

  function isValidEmail(e: string) {
    try { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); } catch { return false; }
  }

  function sanitizeCedula(c: any) {
    try { return String(c ?? '').trim().replace(/[^0-9\-]/g, '').slice(0, 50); } catch { return String(c ?? ''); }
  }

  const canSave = Boolean(sanitizeText(localNombre).length > 0) && (localCorreo ? isValidEmail(String(localCorreo)) : true);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} role="dialog" aria-modal>
      <div style={{ width: 640, maxWidth: '94%', background: 'white', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: 0, color: '#0b7285' }}>{title}</h3>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={localNombre} onChange={(e) => setLocalNombre(e.target.value)} placeholder="Nombre" style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <input value={String(localCedula ?? '')} onChange={(e) => setLocalCedula(e.target.value)} placeholder="Cédula" style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <input value={localCorreo} onChange={(e) => setLocalCorreo(e.target.value)} placeholder="Correo" style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={localEmpleado} onChange={(e) => setLocalEmpleado(e.target.checked)} /> Empleado
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button ref={cancelRef} onClick={onCancel} disabled={loading} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5d9', background: 'white', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={async () => {
            if (!canSave) { alert('Por favor revisa los campos requeridos.'); return; }
            const payload = { nombre: sanitizeText(localNombre, 200), cedula: sanitizeCedula(localCedula), correo: localCorreo ? String(localCorreo).trim().slice(0,200) : undefined, Empleado: !!localEmpleado };
            await onConfirm(payload);
          }} disabled={loading || !canSave} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', color: 'white', background: 'linear-gradient(90deg,#25ABB9 0%, #19A7A6 100%)', cursor: 'pointer' }}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
