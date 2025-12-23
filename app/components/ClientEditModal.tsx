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
          <button onClick={async () => { await onConfirm({ nombre: localNombre, cedula: localCedula, correo: localCorreo, Empleado: localEmpleado }); }} disabled={loading} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', color: 'white', background: 'linear-gradient(90deg,#25ABB9 0%, #19A7A6 100%)', cursor: 'pointer' }}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
