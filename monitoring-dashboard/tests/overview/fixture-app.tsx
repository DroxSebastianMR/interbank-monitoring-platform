// Development-only visual fixture. This entry is not imported by the application.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  MemoryRouter,
  useRoutes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { protectedRoutes } from "../../src/app/router/routes/protected.routes";
import { AuthContext } from "../../src/app/providers/auth/auth-context";
import { apiClient } from "../../src/infrastructure/api/client/axios.instance";
import { fixtureAdapter } from "./adapter";
import type { Scenario } from "./adapter";
import "../../src/index.css";
import "../../src/styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
let scenario: Scenario = "healthy";
apiClient.defaults.adapter = fixtureAdapter(() => scenario);
const employee = {
  id: "visual-test",
  firstName: "Prueba",
  lastName: "Controlada",
  corporateEmail: "fixture@example.invalid",
  roles: ["TEST"],
  permissions: [
    "dashboard.read",
    "analytics.read",
    "services.read",
    "incidents.read",
    "alerts.read",
  ],
};
function Fixture() {
  const routes = useRoutes(protectedRoutes);
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Scenario>("healthy");
  return (
    <>
      <div
        style={{
          padding: 8,
          background: "#fff5d6",
          color: "#4c462f",
          fontSize: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <strong>PRUEBA CONTROLADA · sin conexión a un backend real</strong>
        <label>
          Escenario{" "}
          <select
            aria-label="Escenario de prueba"
            value={selected}
            onChange={(event) => {
              scenario = event.target.value as Scenario;
              setSelected(scenario);
              void queryClient.invalidateQueries();
            }}
          >
            {[
              "healthy",
              "degraded",
              "incident",
              "empty",
              "no-data",
              "partial",
              "offline",
              "forbidden",
              "unauthorized",
              "legacy",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button onClick={() => navigate(-1)}>Atrás (prueba)</button>
        <output aria-label="Ruta de prueba">
          {location.pathname}
          {location.search}
        </output>
      </div>
      {routes}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          employee,
          isLoading: false,
          signIn: async () => {},
          signOut: async () => {},
        }}
      >
        <MemoryRouter initialEntries={["/?period=1h"]}>
          <Fixture />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  </React.StrictMode>,
);
