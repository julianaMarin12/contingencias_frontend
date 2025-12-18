"use client";
import React, { useEffect, useState } from "react";

export type Role = { rol_id?: number; nombre?: string; descripcion?: string };

type ActionsNavProps = {
  actions?: string[];
  active?: string;
  onChange?: (action: string) => void;
};

export default function ActionsNav({ actions = ["Listar", "Crear", "Modificar", "Eliminar"], active, onChange }: ActionsNavProps) {
  const [internalActive, setInternalActive] = useState<string>(active ?? actions[0]);
  useEffect(() => {
    if (active !== undefined) setInternalActive(active);
  }, [active]);
  const currentActive = active ?? internalActive;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => {
              if (onChange) onChange(a);
              else setInternalActive(a);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid #25ABB9`,
              background: currentActive === a ? "white" : "#25ABB9",
              color: currentActive === a ? "#25ABB9" : "white",
              cursor: "pointer",
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

