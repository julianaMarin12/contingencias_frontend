"use client";
import React, { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { useRouter } from "next/navigation";
import { postLogin } from "../lib/api";

export default function LoginCard() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await postLogin(user, pass);
      if (!result.ok) {
        const body = result.data;
        const msg = body?.message || body?.msg || `Error ${result.status}`;
        console.error("Login failed:", result.status, body);
        alert(msg);
        return;
      }

      const data = result.data ?? {};
      const token = data?.token || data?.accessToken || data?.data?.token;
      if (token) {
        try { localStorage.setItem("token", token); } catch (e) { /* ignore */ }
      }

      let userObj: any = null;
      if (Array.isArray(data) && data.length > 0) userObj = data[0];
      else if (data?.data && Array.isArray(data.data) && data.data.length > 0) userObj = data.data[0];
      else if (data?.usuario && typeof data.usuario === "object") userObj = data.usuario;
      else if (data?.data && typeof data.data === "object") userObj = data.data;
      else if (data && typeof data === "object") userObj = data;

      const rawRole = userObj?.rol ?? userObj?.role ?? null;
      let roleId = rawRole?.rol_id ?? rawRole?.id ?? userObj?.rol_id ?? null;
      let roleName: string | null = null;
      if (typeof rawRole === "string") roleName = rawRole;
      else if (rawRole && typeof rawRole === "object") roleName = rawRole.nombre ?? rawRole.name ?? null;
      else roleName = userObj?.rol ?? userObj?.role ?? null;

      try {
        const dbg = { data, userObj, rawRole, roleId, roleName };
        setDebugInfo(JSON.stringify(dbg, null, 2));
      } catch (e) {}

      const isAdmin = roleId === 1 || String(roleId) === "1" || String(roleName).toLowerCase() === "administrador" || String(roleName).toLowerCase() === "admin";
      if (isAdmin) {
        router.push("/admin");
        return;
      }

      router.push("/stores");

      
    } catch (err) {
      console.error("Login error:", err);
      alert("Error de conexión");
    }
  }

  return (
    <div className="shell" role="main">
      <div className="left-pane">
        <div>
          <div className="brand-title">INICIAR SESIÓN</div>
          <div className="subtitle">Bienvenido a nuestra aplicación de facturas de contingencia</div>
        </div>

        <form className="form-card" onSubmit={handleLogin}>
          <Input placeholder="Usuario" value={user} onChange={setUser} />
          <Input placeholder="Contraseña" type="password" value={pass} onChange={setPass} />
          <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <a className="link-small" href="/forgot">Olvidaste la contraseña?</a>
          </div>
          <Button type="submit">Iniciar sesión</Button>
        </form>
      </div>
    </div>
  );
}
