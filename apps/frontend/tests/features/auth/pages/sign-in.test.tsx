import { describe, expect, it } from "vitest"
import { waitFor, screen, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderHook, act } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import type { ReactNode } from "react"
import { LoginPage } from "@/features/auth/pages/login.page"
import { useSignIn } from "@/features/auth/hooks/sign-in.hook"
import { sessionQueryKey } from "@/features/auth/constants/auth.constants"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../../msw/server"
import {
  signInSuccess,
  signInInvalid,
  meUnauthenticated,
  salesUser,
  adminUser,
} from "../../../msw/handlers"
import { createTestQueryClient } from "../../../helpers/render"

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderLogin(client = createTestQueryClient()) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<LocationProbe />} />
          <Route path="/sales" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("useSignIn", () => {
  function hookWrapper(client = createTestQueryClient()) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }
  }

  it("resolves with the user and seeds the session cache on success", async () => {
    server.use(signInSuccess(adminUser))
    const client = createTestQueryClient()

    const { result } = renderHook(() => useSignIn(), {
      wrapper: hookWrapper(client),
    })

    let resolved: unknown
    await act(async () => {
      resolved = await result.current.mutateAsync({
        email: "admin@vulkan.test",
        password: "pw",
      })
    })

    expect(resolved).toEqual(adminUser)
    expect(client.getQueryData(sessionQueryKey)).toEqual(adminUser)
  })

  it("rejects with an ApiError carrying the code on 401", async () => {
    server.use(signInInvalid())

    const { result } = renderHook(() => useSignIn(), {
      wrapper: hookWrapper(),
    })

    const error = await result.current
      .mutateAsync({ email: "x@y.co", password: "bad" })
      .catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe("INVALID_CREDENTIALS")
  })
})

describe("LoginPage", () => {
  it("redirects to the role landing after a successful sign in", async () => {
    server.use(meUnauthenticated(), signInSuccess(salesUser))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), "sales@vulkan.test")
    await user.type(screen.getByLabelText(/password/i), "correct-horse")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/sales")
    })
  })

  it("shows an inline error on 401 INVALID_CREDENTIALS and does not retry", async () => {
    const calls = { count: 0 }
    server.use(meUnauthenticated(), signInInvalid(calls))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), "wrong@vulkan.test")
    await user.type(screen.getByLabelText(/password/i), "nope")
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/invalid email or password/i)

    await new Promise((r) => setTimeout(r, 150))
    expect(calls.count).toBe(1)
  })

  it("does not submit when fields are empty (client validation)", async () => {
    const calls = { count: 0 }
    server.use(meUnauthenticated(), signInInvalid(calls))
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
    expect(calls.count).toBe(0)
  })
})
