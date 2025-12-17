"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";


export default function ResetCard() {
	const router = useRouter();

	return (
		<div className="shell" role="main">
			<div className="left-pane">
				<div>
					<div className="brand-title">RECUPERAR CONTRASEÑA</div>
					<div className="subtitle">
						Debe contactar al administrador
						<br />
						debido a que este proceso es
						<br />
						realizado por él.
					</div>
				</div>

				<div className="form-card">
					<div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
						<Button onClick={() => router.push('/')}>Volver al inicio</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
