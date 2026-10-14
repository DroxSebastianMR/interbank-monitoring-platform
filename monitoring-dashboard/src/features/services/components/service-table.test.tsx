import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ServiceTable } from './service-table';

describe("ServiceTable", () => {
  it("renders service state and navigates to its detail", () => {
    render(
      <MemoryRouter>
        <ServiceTable
          services={[
            {
              id: "login",
              name: "Login",
              status: "OPERATIONAL",
              lastCheckedAt: null,
              latencyMs: 20,
              message: "Healthy",
            },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("OPERATIONAL")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/services/login",
    );
  });
});
