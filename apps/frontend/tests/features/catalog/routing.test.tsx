import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createMemoryRouter, RouterProvider, useLocation } from "react-router"
import { ProtectedRoute } from "@/features/auth/components/protected-route.component"
import { CatalogPage } from "@/features/catalog/pages/catalog.page"
import { server } from "../../msw/server"
import { meAuthenticated, adminUser, salesUser } from "../../msw/handlers"
import { listOfferingsPaged, makeOfferings } from "../../msw/offerings.handlers"
import { createTestQueryClient } from "../../helpers/render"
import { installRadixJsdomShims } from "../../helpers/radix"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

installRadixJsdomShims()

function LocationProbe({ label }: { label: string }) {
  const location = useLocation()
  return (
    <div>
      <p>{label}</p>
      <div data-testid="location">{location.pathname}</div>
    </div>
  )
}

function buildRouter() {
  return createMemoryRouter(
    [
      { path: "/sales", element: <LocationProbe label="Sales workspace" /> },
      { path: "/admin", element: <LocationProbe label="Admin console" /> },
      {
        path: "/catalog",
        element: (
          <ProtectedRoute requiredRole="admin">
            <CatalogPage />
          </ProtectedRoute>
        ),
      },
    ],
    { initialEntries: ["/catalog"] },
  )
}

function renderApp() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={buildRouter()} />
    </QueryClientProvider>,
  )
}

describe("admin-only /catalog routing", () => {
  it("redirects a sales user away from /catalog to their landing", async () => {
    server.use(meAuthenticated(salesUser))
    renderApp()

    expect(await screen.findByText("Sales workspace")).toBeInTheDocument()
    expect(screen.getByTestId("location")).toHaveTextContent("/sales")
    expect(
      screen.queryByRole("heading", { name: "Catalog" }),
    ).not.toBeInTheDocument()
  })

  it("lets an admin reach the catalog", async () => {
    server.use(meAuthenticated(adminUser), listOfferingsPaged(makeOfferings(3)))
    renderApp()

    expect(
      await screen.findByRole("heading", { name: "Catalog" }),
    ).toBeInTheDocument()
  })
})
