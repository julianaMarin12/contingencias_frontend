import SideMenu from "../components/SideMenu";

export default function Page() {
  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <SideMenu showTitle initialOpen={true} />
      <main style={{ flex: 1 }}>
        <div style={{ borderRadius: 20, padding: 24, background: "#ffffff", minHeight: "80vh" }}>
          <h2 style={{ color: "#19A7A6", marginTop: 0 }}>ADMINISTRADOR</h2>
          <div style={{ marginTop: 12 }}>
            {/* Aquí iría el contenido: tabla de roles mostrado en la imagen */}
            <p>Contenido administrativo: lista de roles, tiendas, usuarios, etc.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
