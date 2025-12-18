"use client";
import React, { useState } from "react";

export type Role = { rol_id?: number; nombre?: string; descripcion?: string };

type Props = {
  roles: Role[];
  loading?: boolean;
  error?: string | null;
};

export default function ActionsNav({ roles, loading = false, error = null }: Props) {
  const actions = ["Listar", "Crear", "Modificar", "Eliminar"];
  const [active, setActive] = useState<string>("Listar");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setActive(a)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid #25ABB9`,
              background: active === a ? "white" : "#25ABB9",
              color: active === a ? "#25ABB9" : "white",
              cursor: "pointer",
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {active === "Listar" && (
          <div>
            <h3 style={{ margin: "8px 0", color: "#0b7285" }}>Roles</h3>
            {loading && <p>Cargando roles...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && (
              <div style={{ border: "1px solid #b7e3e2", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ display: "flex", background: "#19A7A6", color: "white", fontWeight: 700 }}>
                  <div style={{ flex: 1, padding: "10px 12px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>NOMBRE</div>
                  <div style={{ flex: 1, padding: "10px 12px" }}>DESCRIPCIÓN</div>
                </div>
                <div>
                  {(!roles || roles.length === 0) ? (
                    <div style={{ padding: 12, color: "#666" }}>No se encontraron roles.</div>
                  ) : (
                    roles.map((r) => (
                      <div key={String(r.rol_id ?? r.nombre)} style={{ display: "flex", borderTop: "1px solid #e6f7f6" }}>
                        <div style={{ flex: 1, padding: "10px 12px", color: "#19A7A6" }}>{r.nombre}</div>
                        <div style={{ flex: 1, padding: "10px 12px" }}>{r.descripcion}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {active !== "Listar" && (
          <div style={{ color: "#333" }}>
            <p>{active} — vista no implementada todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
}
