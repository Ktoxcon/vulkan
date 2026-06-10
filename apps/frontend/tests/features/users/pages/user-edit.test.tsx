import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { UserEditPage } from "@/features/users/pages/user-edit.page"
import { server } from "../../../msw/server"
import { meAuthenticated, adminUser } from "../../../msw/handlers"
import {
  getUser,
  getUserNotFound,
  makeUser,
  patchAnyUser,
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

function renderEdit(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/users/${id}`]}>
        <Routes>
          <Route path="/users/:id" element={<UserEditPage />} />
          <Route path="/users" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("UserEditPage", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("renders a not-found state on 404", async () => {
    server.use(meAuthenticated(adminUser), getUserNotFound("missing"))
    renderEdit("missing")

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument()
  })

  it("loads the user with email read-only and updates name + optional password", async () => {
    const target = makeUser({
      id: "u-9",
      name: "Old",
      lastName: "Name",
      email: "old@vulkan.test",
      role: "sales",
      status: "ACTIVE",
    })
    server.use(meAuthenticated(adminUser), getUser(target))
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      patchAnyUser(
        (_id, body) =>
          makeUser({
            id: "u-9",
            name: (body.name as string) ?? "Old",
            lastName: (body.lastName as string) ?? "Name",
            email: "old@vulkan.test",
          }),
        capture,
      ),
    )

    const user = userEvent.setup()
    renderEdit("u-9")

    const nameField = await screen.findByLabelText(/first name/i)
    await waitFor(() => expect(nameField).toHaveValue("Old"))

    const emailField = screen.getByLabelText(/^email$/i)
    expect(emailField).toHaveValue("old@vulkan.test")
    expect(emailField).toBeDisabled()

    await user.clear(nameField)
    await user.type(nameField, "Renamed")
    await user.type(screen.getByLabelText(/reset password/i), "brandnewpass")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/users")
    })
    expect(capture.id).toBe("u-9")
    expect(capture.body?.name).toBe("Renamed")
    expect(capture.body?.password).toBe("brandnewpass")
    expect(capture.body).not.toHaveProperty("email")
    expect(toastSuccess).toHaveBeenCalled()
  })

  it("omits password when the reset field is left blank", async () => {
    const target = makeUser({ id: "u-9", name: "Keep", email: "keep@vulkan.test" })
    server.use(meAuthenticated(adminUser), getUser(target))
    const capture: { body?: Record<string, unknown> } = {}
    server.use(patchAnyUser(() => target, capture))

    const user = userEvent.setup()
    renderEdit("u-9")

    await waitFor(() =>
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Keep"),
    )
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => expect(capture.body).toBeDefined())
    expect(capture.body).not.toHaveProperty("password")
  })

  it("updates the role through the select and maps it to userRole on the wire", async () => {
    const target = makeUser({ id: "u-9", role: "sales", email: "x@vulkan.test" })
    server.use(meAuthenticated(adminUser), getUser(target))
    const capture: { body?: Record<string, unknown> } = {}
    server.use(patchAnyUser(() => makeUser({ id: "u-9", role: "admin" }), capture))

    const user = userEvent.setup()
    renderEdit("u-9")

    await waitFor(() =>
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Vulcan"),
    )

    await user.click(screen.getByRole("combobox", { name: /role/i }))
    const listbox = await screen.findByRole("listbox")
    await user.click(within(listbox).getByRole("option", { name: "Admin" }))

    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => expect(capture.body).toBeDefined())
    expect(capture.body?.userRole).toBe("admin")
  })

  it("self-guard: editing your own row disables demotion and deactivation", async () => {
    const self = makeUser({
      id: adminUser.id,
      name: "Vulkan",
      lastName: "Prime",
      email: adminUser.email,
      role: "admin",
      status: "ACTIVE",
    })
    server.use(meAuthenticated(adminUser), getUser(self))

    const user = userEvent.setup()
    renderEdit(adminUser.id)

    await waitFor(() =>
      expect(screen.getByLabelText(/first name/i)).toHaveValue("Vulkan"),
    )

    expect(screen.getByText(/you cannot change your own role/i)).toBeInTheDocument()
    expect(
      screen.getByText(/you cannot deactivate your own account/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("combobox", { name: /role/i }))
    const roleList = await screen.findByRole("listbox")
    expect(within(roleList).getByRole("option", { name: "Sales" })).toHaveAttribute(
      "aria-disabled",
      "true",
    )
  })
})
