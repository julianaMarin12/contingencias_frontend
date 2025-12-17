"use client";
import React, { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { useRouter } from "next/navigation";

export default function LoginCard() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    router.push("/stores");
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
