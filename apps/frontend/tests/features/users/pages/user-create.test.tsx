import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { UserCreatePage } from "@/features/users/pages/user-create.page"
import { server } from "../../../msw/server"
import {
  createUserConflict,
  createUserSuccess,
  makeUser,
} from "../../../msw/users.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

const toastSuccess = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
  },
}))

installRadixJsdomShims()

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderCreate() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/users/new"]}>
        <Routes>
          <Route path="/users/new" element={<UserCreatePage />} />
          <Route path="/users" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), "Forge")
  await user.type(screen.getByLabelText(/last name/i), "Master")
  await user.type(screen.getByLabelText(/email/i), "forge@vulkan.test")
  await user.type(screen.getByLabelText(/password/i), "supersecret")
}

describe("UserCreatePage", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("creates a user, toasts, and redirects to /users", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createUserSuccess(capture, makeUser({ id: "u-new", name: "Forge", lastName: "Master" })))
    const user = userEvent.setup()
    renderCreate()

    await fillRequired(user)
    await user.click(screen.getByRole("button", { name: /create user/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/users")
    })
    expect(toastSuccess).toHaveBeenCalledWith("Forge Master created")
    expect(capture.body?.userRole).toBe("sales")
    expect(capture.body?.status).toBe("ACTIVE")
  })

  it("shows an inline email error on 409 USER_ALREADY_EXISTS", async () => {
    server.use(createUserConflict())
    const user = userEvent.setup()
    renderCreate()

    await fillRequired(user)
    await user.click(screen.getByRole("button", { name: /create user/i }))

    expect(
      await screen.findByText(/a user with this email already exists/i),
    ).toBeInTheDocument()
    expect(screen.queryByTestId("location")).not.toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it("blocks submit when the password is shorter than 8 chars", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createUserSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/first name/i), "Forge")
    await user.type(screen.getByLabelText(/last name/i), "Master")
    await user.type(screen.getByLabelText(/email/i), "forge@vulkan.test")
    await user.type(screen.getByLabelText(/password/i), "short")
    await user.click(screen.getByRole("button", { name: /create user/i }))

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })

  it("blocks submit on an invalid email", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createUserSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/first name/i), "Forge")
    await user.type(screen.getByLabelText(/last name/i), "Master")
    await user.type(screen.getByLabelText(/email/i), "not-an-email")
    await user.type(screen.getByLabelText(/password/i), "supersecret")
    await user.click(screen.getByRole("button", { name: /create user/i }))

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })
})
