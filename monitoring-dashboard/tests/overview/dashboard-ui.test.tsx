import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../src/app/providers/auth/auth-context";
import { DashboardPage } from "../../src/features/dashboard/pages/dashboard-page";
import { apiClient } from "../../src/infrastructure/api/client/axios.instance";
import { fixtureAdapter } from "./adapter";
import type { Scenario } from "./adapter";

const employee = {
  id: "test-operator",
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
const clients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function mount(scenario: Scenario, path = "/") {
  let current = scenario;
  const requests: Array<{ url: string; params: unknown }> = [];
  apiClient.defaults.adapter = fixtureAdapter(
    () => current,
    (url, params) => requests.push({ url, params }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={{
          employee,
          isLoading: false,
          signIn: async () => {},
          signOut: async () => {},
        }}
      >
        <MemoryRouter initialEntries={[path]}>
          <DashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return {
    requests,
    change: (next: Scenario) => {
      current = next;
      return client.invalidateQueries();
    },
  };
}
describe("real overview component with controlled API responses", () => {
  it("renders all seven sections and exposes six primary cards", async () => {
    mount("healthy");
    await screen.findByRole("heading", { name: "Estado por servicio" });
    for (const name of [
      "Resumen operativo",
      "Requiere atención",
      "Evolución del rendimiento",
      "Infraestructura",
      "Actividad reciente",
    ])
      expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(
      screen
        .getByRole("region", { name: "Indicadores principales" })
        .querySelectorAll("article"),
    ).toHaveLength(6);
    expect(
      screen.getByText(
        "Los 3 servicios están operativos. Sin incidentes abiertos.",
      ),
    ).toBeVisible();
  });
  it.each(["forbidden", "unauthorized", "legacy"] as const)(
    "shows %s distinctly from an empty table",
    async (scenario) => {
      mount(scenario);
      const heading =
        scenario === "forbidden"
          ? "Acceso denegado"
          : scenario === "unauthorized"
            ? "Sesión no autorizada"
            : "Contrato de monitoreo no disponible";
      expect(
        await screen.findByRole("heading", { name: heading }),
      ).toBeVisible();
      expect(
        screen.queryByText(
          "Los 3 servicios están operativos. Sin incidentes abiertos.",
        ),
      ).not.toBeInTheDocument();
    },
  );
  it("keeps the confirmed last total and suppresses operational assurance after disconnection", async () => {
    const app = mount("healthy");
    await screen.findByRole("heading", { name: "Estado por servicio" });
    await app.change("offline");
    expect(
      await screen.findByText("Último total recibido · desactualizado"),
    ).toBeVisible();
    expect(
      screen.getByText("No se puede comprobar el estado actual."),
    ).toBeVisible();
    expect(
      screen.queryByText(
        "Los 3 servicios están operativos. Sin incidentes abiertos.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar fuentes" }),
    ).toBeEnabled();
  });
  it("uses service and period URL parameters in actual query requests", async () => {
    const app = mount(
      "healthy",
      "/?period=6h&service=balance&performance=http-rps",
    );
    await screen.findByRole("heading", { name: "Estado por servicio" });
    await waitFor(() =>
      expect(
        app.requests.some((request) => request.url === "/dashboard/metrics"),
      ).toBe(true),
    );
    const query = app.requests.find(
      (request) => request.url === "/dashboard/metrics",
    )!.params as { from: string; to: string; serviceId: string };
    expect(query.serviceId).toBe("balance");
    expect(Date.parse(query.to) - Date.parse(query.from)).toBe(6 * 3600000);
    expect(
      screen.getByText(
        "No hay métricas de tráfico disponibles para este periodo.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ver detalle de Consulta de saldo" }),
    ).toHaveAttribute("href", expect.stringContaining("performance=http-rps"));
  });
});
