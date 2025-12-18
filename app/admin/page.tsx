"use client";
import React, { useEffect, useState } from "react";
import SideMenu from "../components/SideMenu";
import ActionsNav, { Role } from "../components/ActionsNav";
import { loadRoles } from "../lib/roles";

export default function Page() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      const res = await loadRoles();
      if (cancelled) return;
      if (!res.ok) {
        setRoles([]);
        setError(res.error ?? `Error ${res.status}`);
      } else {
        setRoles(res.roles);
      }
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true };
  }, []);

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: "#ffffff", minHeight: "80vh" }}>
          <h2 style={{ color: "#19A7A6", marginTop: 0, fontWeight: "bold" }}>ADMINISTRADOR</h2>
          <div style={{ marginTop: 12 }}>
            <ActionsNav roles={roles} loading={loading} error={error} />
          </div>
        </div>
      </main>
    </div>
  );
}
