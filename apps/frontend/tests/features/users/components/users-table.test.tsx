import { describe, expect, it, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { UsersPage } from "@/features/users/pages/users.page"
import type { User } from "@/features/users/types/user.types"
import { server } from "../../../msw/server"
import { apiUrl, meAuthenticated, adminUser } from "../../../msw/handlers"
import { listUsersPaged, makeUser, patchAnyUser } from "../../../msw/users.handlers"
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

function renderUsersPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/users"]}>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function rowFor(name: string) {
  return screen.getByText(name).closest("tr") as HTMLElement
}

function listLive(getItems: () => User[]) {
  return http.get(apiUrl("/users"), () => {
    const items = getItems()
    return HttpResponse.json({ success: true, data: { count: items.length, items } })
  })
}

describe("UsersTable (via UsersPage)", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("deactivate requires confirmation then flips the status badge to Inactive", async () => {
    let store: User = makeUser({
      id: "u-1",
      name: "Active",
      lastName: "One",
      email: "a1@vulkan.test",
      status: "ACTIVE",
    })
    server.use(
      meAuthenticated(adminUser),
      listLive(() => [store]),
      patchAnyUser((_id, body) => {
        store = { ...store, status: body.status as User["status"] }
        return store
      }),
    )

    const user = userEvent.setup()
    renderUsersPage()

    await screen.findByText("Active One")
    const row = rowFor("Active One")
    expect(within(row).getByText("Active")).toBeInTheDocument()

    await user.click(within(row).getByRole("button", { name: /deactivate/i }))

    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: /deactivate/i }))

    await waitFor(() => {
      expect(within(rowFor("Active One")).getByText("Inactive")).toBeInTheDocument()
    })
    expect(toastSuccess).toHaveBeenCalledWith("Active deactivated")
  })

  it("reactivate flips an inactive user back to Active", async () => {
    let store: User = makeUser({
      id: "u-2",
      name: "Dormant",
      lastName: "Two",
      email: "d2@vulkan.test",
      status: "INACTIVE",
    })
    server.use(
      meAuthenticated(adminUser),
      listLive(() => [store]),
      patchAnyUser((_id, body) => {
        store = { ...store, status: body.status as User["status"] }
        return store
      }),
    )

    const user = userEvent.setup()
    renderUsersPage()

    await screen.findByText("Dormant Two")
    const row = rowFor("Dormant Two")
    expect(within(row).getByText("Inactive")).toBeInTheDocument()

    await user.click(within(row).getByRole("button", { name: /reactivate/i }))

    await waitFor(() => {
      expect(within(rowFor("Dormant Two")).getByText("Active")).toBeInTheDocument()
    })
    expect(toastSuccess).toHaveBeenCalledWith("Dormant reactivated")
  })

  it("self-guard: the signed-in admin cannot deactivate their own row", async () => {
    const self = makeUser({
      id: adminUser.id,
      name: "Vulkan",
      lastName: "Prime",
      email: adminUser.email,
      role: "admin",
      status: "ACTIVE",
    })
    const other = makeUser({
      id: "u-other",
      name: "Other",
      lastName: "Admin",
      email: "other@vulkan.test",
      role: "admin",
      status: "ACTIVE",
    })
    server.use(meAuthenticated(adminUser), listUsersPaged([self, other]))

    renderUsersPage()

    await screen.findByText("Vulkan Prime")
    await waitFor(() =>
      expect(
        within(rowFor("Vulkan Prime")).getByRole("button", { name: /deactivate/i }),
      ).toBeDisabled(),
    )

    const otherRow = rowFor("Other Admin")
    expect(
      within(otherRow).getByRole("button", { name: /deactivate/i }),
    ).toBeEnabled()
  })
})
