import { describe, expect, it } from "vitest"
import { screen, waitFor, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { createMemoryRouter, RouterProvider, Outlet } from "react-router"
import { ProtectedRoute } from "@/features/auth/components/protected-route.component"
import { AppLayout } from "@/components/layouts/app.layout"
import { server } from "../../../msw/server"
import {
  meAuthenticated,
  meUnauthenticated,
  signOutSuccess,
  adminUser,
} from "../../../msw/handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

installRadixJsdomShims()

function buildRouter(initial: string) {
  return createMemoryRouter(
    [
      { path: "/login", element: <p>Login screen</p> },
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <p>Home dashboard</p> },
        ],
      },
      { path: "*", element: <Outlet /> },
    ],
    { initialEntries: [initial] },
  )
}

function renderApp(initial = "/") {
  const client = createTestQueryClient()
  const router = buildRouter(initial)
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe("session restore", () => {
  it("shows the authenticated app when GET /auth/me returns a user", async () => {
    server.use(meAuthenticated(adminUser))
    renderApp("/")

    expect(await screen.findByText("Home dashboard")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /account menu/i })).toBeInTheDocument()
    expect(screen.getByText("VP")).toBeInTheDocument()
  })

  it("redirects to /login when GET /auth/me returns 401", async () => {
    server.use(meUnauthenticated())
    renderApp("/")

    expect(await screen.findByText("Login screen")).toBeInTheDocument()
  })

  it("does not retry /auth/me after a 401", async () => {
    const calls = { count: 0 }
    server.use(meUnauthenticated(calls))
    renderApp("/")

    expect(await screen.findByText("Login screen")).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 150))
    expect(calls.count).toBe(1)
  })
})

describe("useSignOut via AppLayout", () => {
  it("clears the session and bounces to /login", async () => {
    server.use(meAuthenticated(adminUser), signOutSuccess())
    const user = userEvent.setup()
    renderApp("/")

    expect(await screen.findByText("Home dashboard")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /account menu/i }))
    await user.click(await screen.findByRole("menuitem", { name: /sign out/i }))

    await waitFor(() =>
      expect(screen.getByText("Login screen")).toBeInTheDocument(),
    )
  })
})
