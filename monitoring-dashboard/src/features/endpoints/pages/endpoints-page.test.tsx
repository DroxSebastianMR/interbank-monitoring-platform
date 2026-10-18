import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/providers/auth/auth-context";
import { EndpointsPage } from "@/features/endpoints/pages/endpoints-page";
import { endpointsService } from "@/features/endpoints/services/endpoints.service";
import {
  EndpointTrafficState,
  TelemetryState,
} from "@/features/endpoints/enums/endpoint-state.enum";
import type { EndpointSnapshot } from "@/features/endpoints/types/endpoint.types";
import {
  ALL_ENDPOINTS,
  errorPercent,
  filterEndpoints,
} from "@/features/endpoints/utils/endpoint-metrics";

const snapshot = (): EndpointSnapshot => ({
  sourceState: TelemetryState.AVAILABLE,
  generatedAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  refreshIntervalMs: 10000,
  windowSeconds: 120,
  instances: [
    {
      id: "instance-1",
      state: TelemetryState.AVAILABLE,
      observedAt: new Date().toISOString(),
      endpointCount: 2,
    },
  ],
  endpoints: ["/auth/login", "/loans"].map((route) => ({
    instance: "instance-1",
    module: route === "/loans" ? "Loans" : "Auth",
    route,
    method: "POST",
    state: TelemetryState.AVAILABLE,
    traffic: EndpointTrafficState.NO_TRAFFIC,
    observedAt: null,
    requestRateHz: 0,
    clientErrorRateHz: null,
    serverErrorRateHz: null,
    latencyP95Ms: null,
    observedRequests: 0,
  })),
});

function renderPage(permissions: string[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider
        value={{
          employee: {
            id: "test",
            corporateEmail: "test@example.test",
            firstName: "Test",
            lastName: "User",
            roles: [],
            permissions,
          },
          isLoading: false,
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={["/endpoints"]}>
          <Routes>
            <Route path="/endpoints" element={<EndpointsPage />} />
            <Route path="/403" element={<p>Acceso denegado</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Endpoints page", () => {
  it("blocks the page and API call without permission", async () => {
    const api = vi
      .spyOn(endpointsService, "snapshot")
      .mockResolvedValue(snapshot());
    renderPage(["dashboard.read"]);
    expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });
  it("shows routes with no traffic and filters locally, without querying per keystroke", async () => {
    const api = vi
      .spyOn(endpointsService, "snapshot")
      .mockResolvedValue(snapshot());
    renderPage(["analytics.read"]);
    expect(await screen.findByText("/auth/login")).toBeInTheDocument();
    expect(screen.getAllByText("Sin tráfico en la ventana")).toHaveLength(2);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "loans" },
    });
    expect(screen.queryByText("/auth/login")).not.toBeInTheDocument();
    expect(screen.getByText("/loans")).toBeInTheDocument();
    expect(api).toHaveBeenCalledTimes(1);
  });
  it("hides metrics on transport failure instead of showing a healthy-looking cache", async () => {
    vi.spyOn(endpointsService, "snapshot").mockRejectedValue(
      new Error("network"),
    );
    renderPage(["analytics.read"]);
    expect(
      await screen.findByText(/No se pudo consultar el catálogo/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("supports combined instance/module/method filters and never treats no traffic as 0% error", () => {
    const data = snapshot().endpoints;
    expect(
      filterEndpoints(data, {
        instance: "instance-1",
        module: "Auth",
        method: "POST",
        search: "login",
      }),
    ).toHaveLength(1);
    expect(
      filterEndpoints(data, {
        instance: "instance-2",
        module: ALL_ENDPOINTS,
        method: ALL_ENDPOINTS,
        search: "",
      }),
    ).toHaveLength(0);
    expect(errorPercent(data[0])).toBeNull();
    expect(
      errorPercent({ ...data[0], requestRateHz: 10, serverErrorRateHz: 1 }),
    ).toBe(10);
  });
});
