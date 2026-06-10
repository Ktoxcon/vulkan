import { describe, expect, it } from "vitest"
import { screen, waitFor, render } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router"
import { ProtectedRoute } from "@/features/auth/components/protected-route.component"
import { server } from "../../../msw/server"
import {
  meAuthenticated,
  meUnauthenticated,
  adminUser,
  salesUser,
} from "../../../msw/handlers"
import { createTestQueryClient } from "../../../helpers/render"

function LoginStub() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  return (
    <div>
      <p>Login screen</p>
      <p data-testid="from">{from ?? ""}</p>
    </div>
  )
}

function buildRouter(initial: string) {
  return createMemoryRouter(
    [
      { path: "/login", element: <LoginStub /> },
      { path: "/403", element: <p>Forbidden</p> },
      {
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <p>Home dashboard</p> },
          {
            path: "/admin",
            element: (
              <ProtectedRoute requiredRole="admin">
                <p>Admin console</p>
              </ProtectedRoute>
            ),
          },
          {
            path: "/sales",
            element: (
              <ProtectedRoute requiredRole="sales">
                <p>Sales workspace</p>
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
    { initialEntries: [initial] },
  )
}

function renderRoute(initial: string) {
  const client = createTestQueryClient()
  const router = buildRouter(initial)
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe("ProtectedRoute", () => {
  it("renders children when the session is authenticated", async () => {
    server.use(meAuthenticated(adminUser))
    renderRoute("/")

    expect(await screen.findByText("Home dashboard")).toBeInTheDocument()
  })

  it("redirects to /login with the attempted path when unauthenticated", async () => {
    server.use(meUnauthenticated())
    renderRoute("/admin")

    expect(await screen.findByText("Login screen")).toBeInTheDocument()
    expect(screen.getByTestId("from")).toHaveTextContent("/admin")
  })

  it("renders the role-guarded child for a matching role", async () => {
    server.use(meAuthenticated(adminUser))
    renderRoute("/admin")

    expect(await screen.findByText("Admin console")).toBeInTheDocument()
  })

  it("blocks the wrong role and redirects to the user's own landing", async () => {
    server.use(meAuthenticated(salesUser))
    renderRoute("/admin")

    expect(await screen.findByText("Sales workspace")).toBeInTheDocument()
    expect(screen.queryByText("Admin console")).not.toBeInTheDocument()
  })

  it("shows a loading state while the session resolves", async () => {
    server.use(meAuthenticated(adminUser))
    renderRoute("/")

    expect(screen.getByLabelText("Loading")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText("Home dashboard")).toBeInTheDocument(),
    )
  })
})
