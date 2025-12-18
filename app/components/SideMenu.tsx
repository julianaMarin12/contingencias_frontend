"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  showTitle?: boolean;
  onLogout?: () => void;
  initialOpen?: boolean;
};

const ITEMS: Array<{ label: string; href: string }> = [
  { label: "ROLES", href: "/admin" },
  { label: "USUARIOS", href: "/admin/users" },
  { label: "TIENDAS", href: "/admin/stores" },
  { label: "PRODUCTOS", href: "/admin/products" },
  { label: "CLIENTES", href: "/admin/clients" },
  { label: "FACTURAS", href: "/admin/invoices" },
];


export default function SideMenu({ showTitle = false, onLogout, initialOpen = true }: Props) {
  const [open, setOpen] = useState<boolean>(initialOpen);
  const [selected, setSelected] = useState<string>(ITEMS[0].href);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cls = "with-side-menu";
    const body = document.body;
    if (open) body.classList.add(cls);
    else body.classList.remove(cls);
    return () => { body.classList.remove(cls); };
  }, [open]);

  return (
    <>
      {/* No floating toggle on desktop — toggle lives inside the panel header */}

      <div className={`side-menu-overlay ${open ? "visible" : ""}`} onClick={() => setOpen(false)} />

      <aside
        id="side-menu"
        className={`side-menu ${open ? "open" : "closed"}`}
        role="navigation"
        aria-expanded={open}
        aria-hidden={!open}
      >
        <div className="side-menu-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {open && showTitle && <div className="side-menu-title">Panel</div>}
          </div>

          <button
            aria-label={open ? 'Colapsar menú' : 'Expandir menú'}
            title={open ? 'Colapsar menú' : 'Expandir menú'}
            className="side-menu-close"
            onClick={() => setOpen((s) => !s)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <ul className="side-menu-simple" role="menu">
          {ITEMS.map((it) => (
            <li key={it.href} role="none">
              <Link
                href={it.href}
                role="menuitem"
                className={`side-menu-link ${selected === it.href ? "active" : ""}`}
                aria-label={it.label}
                  onClick={() => {
                    setSelected(it.href);
                    if (typeof window !== "undefined" && window.innerWidth < 900) setOpen(false);
                  }}
              >
                  <span className="side-menu-icon" aria-hidden>
                    {it.label.charAt(0)}
                  </span>
                <span className="side-menu-label">{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {onLogout && (
          <div className="side-menu-footer-simple">
            <button className="side-menu-logout-simple" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
