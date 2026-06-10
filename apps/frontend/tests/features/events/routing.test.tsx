import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createMemoryRouter, RouterProvider, useLocation } from "react-router"
import { ProtectedRoute } from "@/features/auth/components/protected-route.component"
import { EventsPage } from "@/features/events/pages/events.page"
import { server } from "../../msw/server"
import {
  meAuthenticated,
  meUnauthenticated,
  adminUser,
  salesUser,
} from "../../msw/handlers"
import { listEventsPaged, makeEvents } from "../../msw/events.handlers"
import { createTestQueryClient } from "../../helpers/render"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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
      { path: "/login", element: <LocationProbe label="Login" /> },
      { path: "/sales", element: <LocationProbe label="Sales workspace" /> },
      { path: "/admin", element: <LocationProbe label="Admin console" /> },
      {
        path: "/events",
        element: (
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        ),
      },
    ],
    { initialEntries: ["/events"] },
  )
}

function renderApp() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={buildRouter()} />
    </QueryClientProvider>,
  )
}

describe("/events routing (auth required, any role)", () => {
  it("redirects an unauthenticated visitor to login", async () => {
    server.use(meUnauthenticated())
    renderApp()

    expect(await screen.findByText("Login")).toBeInTheDocument()
    expect(screen.getByTestId("location")).toHaveTextContent("/login")
  })

  it("lets a sales user reach the events list", async () => {
    server.use(meAuthenticated(salesUser), listEventsPaged(makeEvents(2)))
    renderApp()

    expect(await screen.findByRole("heading", { name: "Events" })).toBeInTheDocument()
  })

  it("lets an admin user reach the events list", async () => {
    server.use(meAuthenticated(adminUser), listEventsPaged(makeEvents(2)))
    renderApp()

    expect(await screen.findByRole("heading", { name: "Events" })).toBeInTheDocument()
  })
})
