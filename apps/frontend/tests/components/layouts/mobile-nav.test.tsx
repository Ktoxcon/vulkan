import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes as RouterRoutes, Route, useLocation } from "react-router"
import { MobileNav } from "@/components/layouts/mobile-nav.component"
import { Routes } from "@/lib/constants/routes.constants"
import { installRadixJsdomShims } from "../../helpers/radix"
import type { UserRole } from "@/features/auth/types/auth.types"

const authState: { role: UserRole | null } = { role: null }

vi.mock("@/features/auth/hooks/auth.hook", () => ({
  useAuth: () => ({
    user: null,
    role: authState.role,
    isAuthenticated: authState.role !== null,
    isLoading: false,
  }),
}))

installRadixJsdomShims()

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderNav(role: UserRole) {
  authState.role = role
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <MobileNav />
      <RouterRoutes>
        <Route path="*" element={<LocationProbe />} />
      </RouterRoutes>
    </MemoryRouter>,
  )
}

describe("MobileNav", () => {
  beforeEach(() => {
    authState.role = null
  })

  describe("opening the sheet", () => {
    it("opens the navigation sheet when the hamburger is pressed", async () => {
      const user = userEvent.setup()
      renderNav("admin")

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /open navigation/i }))

      expect(await screen.findByRole("dialog")).toBeInTheDocument()
    })
  })

  describe("role-based items", () => {
    it("shows Events, Catalog and Users for an admin", async () => {
      const user = userEvent.setup()
      renderNav("admin")

      await user.click(screen.getByRole("button", { name: /open navigation/i }))
      const sheet = await screen.findByRole("dialog")

      expect(within(sheet).getByRole("link", { name: /events/i })).toBeInTheDocument()
      expect(within(sheet).getByRole("link", { name: /catalog/i })).toBeInTheDocument()
      expect(within(sheet).getByRole("link", { name: /users/i })).toBeInTheDocument()
    })

    it("shows only Events for a sales user", async () => {
      const user = userEvent.setup()
      renderNav("sales")

      await user.click(screen.getByRole("button", { name: /open navigation/i }))
      const sheet = await screen.findByRole("dialog")

      expect(within(sheet).getByRole("link", { name: /events/i })).toBeInTheDocument()
      expect(within(sheet).queryByRole("link", { name: /catalog/i })).not.toBeInTheDocument()
      expect(within(sheet).queryByRole("link", { name: /users/i })).not.toBeInTheDocument()
    })
  })

  describe("navigating", () => {
    it("navigates to the chosen route and closes the sheet", async () => {
      const user = userEvent.setup()
      renderNav("admin")

      await user.click(screen.getByRole("button", { name: /open navigation/i }))
      const sheet = await screen.findByRole("dialog")

      await user.click(within(sheet).getByRole("link", { name: /events/i }))

      await waitFor(() =>
        expect(screen.getByTestId("location")).toHaveTextContent(Routes.events),
      )
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      )
    })
  })

  describe("dismissal", () => {
    it("closes the sheet via the close icon", async () => {
      const user = userEvent.setup()
      renderNav("admin")

      await user.click(screen.getByRole("button", { name: /open navigation/i }))
      const sheet = await screen.findByRole("dialog")

      await user.click(within(sheet).getByRole("button", { name: /close/i }))

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      )
    })

    it("closes the sheet when Escape is pressed", async () => {
      const user = userEvent.setup()
      renderNav("admin")

      await user.click(screen.getByRole("button", { name: /open navigation/i }))
      expect(await screen.findByRole("dialog")).toBeInTheDocument()

      await user.keyboard("{Escape}")

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      )
    })
  })
})
