"use client";
import React, { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { useRouter } from "next/navigation";

export default function StoreSelectCard() {
  const [store, setStore] = useState("");
  const router = useRouter();

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return; 
    router.push("/products");
  }

  return (
    <div className="shell" role="main">
      <div className="left-pane">
        <div>
          <div className="brand-title">TIENDAS</div>
          <div className="subtitle">Seleccione la tienda de la Venta</div>
        </div>

        <form className="form-card" onSubmit={handleContinue}>
          <div style={{ position: "relative", width: "100%" }}>
            <select
              className="input"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            >
              <option value="" disabled>
                SELECCIONA UNA TIENDA
              </option>
              <option value="BUENAVISTA 1">BUENAVISTA 1</option>
              <option value="BUENAVISTA 2">BUENAVISTA 2</option>
            </select>
          </div>

          <Button type="submit" disabled={!store}>Seguir</Button>
        </form>
      </div>
    </div>
  );
}
