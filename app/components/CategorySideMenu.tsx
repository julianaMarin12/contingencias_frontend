"use client";
import React, { useEffect, useState } from "react";

type CategoryItem = { id?: string | number; label: string };

type Props = {
  categories: CategoryItem[];
  selected?: string | number;
  onSelect: (id?: string | number) => void;
  onLogout?: () => void;
  initialOpen?: boolean;
  showTitle?: boolean;
  showToggle?: boolean;
};

export default function CategorySideMenu({ categories, selected, onSelect, onLogout, initialOpen = false, showTitle = true, showToggle = true }: Props) {
  const [open, setOpen] = useState<boolean>(initialOpen);
  const [cur, setCur] = useState<string | number | undefined>(selected ?? undefined);

  useEffect(() => { if (selected !== undefined) setCur(selected); }, [selected]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const cls = "with-side-menu";
    const body = document.body;
    if (open) body.classList.add(cls);
    else body.classList.remove(cls);
    return () => { body.classList.remove(cls); };
  }, [open]);

  useEffect(() => {
    function handleOpen() { setOpen(true); }
    function handleClose() { setOpen(false); }
    if (typeof window !== 'undefined') {
      window.addEventListener('open-category-menu', handleOpen as EventListener);
      window.addEventListener('close-category-menu', handleClose as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-category-menu', handleOpen as EventListener);
        window.removeEventListener('close-category-menu', handleClose as EventListener);
      }
    };
  }, []);

  function handleLogout() {
    try { if (typeof window !== 'undefined') { window.localStorage.removeItem('access_token'); window.localStorage.removeItem('token'); } } catch(e){}
    if (onLogout) onLogout();
  }

  return (
    <>
      {!open && showToggle && (
        <button
          aria-label="Abrir categorías"
          title="Abrir categorías"
          className="side-toggle-btn"
          onClick={() => setOpen(true)}
          aria-controls="category-side-menu"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 18h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <div className={`side-menu-overlay ${open ? "visible" : ""}`} onClick={() => setOpen(false)} />

      <aside id="category-side-menu" className={`side-menu ${open ? "open" : "closed"}`} role="navigation" aria-expanded={open}>
        <div className="side-menu-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {open && showTitle && <div className="side-menu-title">Categorías</div>}
          </div>

          <button aria-label={open ? 'Colapsar menú' : 'Expandir menú'} title={open ? 'Colapsar menú' : 'Expandir menú'} className="side-menu-close" onClick={() => setOpen((s) => !s)} aria-controls="category-side-menu" aria-expanded={open}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <ul className="side-menu-simple" role="menu" style={{ paddingTop: 6 }}>
          {categories.map((it, idx) => (
            <li key={`${String(it.id ?? it.label)}-${idx}`} role="none">
              <button
                role="menuitem"
                className={`side-menu-link ${String(cur) === String(it.id ?? it.label) ? "active" : ""}`}
                onClick={() => { const val = it.id ?? it.label; console.debug('CategorySideMenu click ->', val); setCur(val); onSelect(val); if (typeof window !== "undefined" && window.innerWidth < 900) setOpen(false); }}
                style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: '8px 6px', cursor: 'pointer' }}
              >
                <span className="side-menu-icon" aria-hidden>{(it.label || '').charAt(0)}</span>
                <span className="side-menu-label">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="side-menu-footer-simple" style={{ marginTop: 'auto' }}>
          <button className="side-menu-logout-simple" onClick={handleLogout} style={{ color: '#fff' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
