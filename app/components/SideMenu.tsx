"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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
  { label: "ZONAS", href: "/admin/zonas" },
];


export default function SideMenu({ showTitle = false, onLogout, initialOpen = true }: Props) {
  const [open, setOpen] = useState<boolean>(initialOpen);
  const [selected, setSelected] = useState<string>(ITEMS[0].href);
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("access_token");
        window.localStorage.removeItem("token");
      }
    } catch (e) {}
    if (onLogout) onLogout();
    else router.push("/");
  }
  useEffect(() => {
    try {
      if (!pathname) return;
      const exact = ITEMS.find((it) => pathname === it.href);
      if (exact) { setSelected(exact.href); return; }
      const prefix = [...ITEMS].sort((a, b) => b.href.length - a.href.length).find((it) => pathname.startsWith(it.href + "/") || pathname === it.href);
      if (prefix) setSelected(prefix.href);
    } catch (e) {}
  }, [pathname]);

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
      {/* floating toggle for mobile when menu is closed */}
      {!open && (
        <button
          aria-label="Abrir menú"
          title="Abrir menú"
          className="side-toggle-btn"
          onClick={() => setOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 18h18" stroke="#0b2540" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
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

        <div className="side-menu-footer-simple">
          <button className="side-menu-logout-simple" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
