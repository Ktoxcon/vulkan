import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes as RouterRoutes, Route, useLocation } from "react-router"
import { AccountMenu } from "@/components/layouts/account-menu.component"
import { Routes } from "@/lib/constants/routes.constants"
import { installRadixJsdomShims } from "../../helpers/radix"
import type { SessionUser } from "@/features/auth/types/auth.types"

const authState: { user: SessionUser | null } = { user: null }
const signOutMutate = vi.fn()
const signOutState = { isPending: false }

vi.mock("@/features/auth/hooks/auth.hook", () => ({
  useAuth: () => ({
    user: authState.user,
    role: authState.user?.userRole ?? null,
    isAuthenticated: authState.user !== null,
    isLoading: false,
  }),
}))

vi.mock("@/features/auth/hooks/sign-out.hook", () => ({
  useSignOut: () => ({
    mutate: signOutMutate,
    isPending: signOutState.isPending,
  }),
}))

installRadixJsdomShims()

const adminUser: SessionUser = {
  id: "u-admin",
  email: "demetrian@vulkan.test",
  name: "Demetrian",
  lastName: "Titus",
  userRole: "admin",
}

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderMenu(user: SessionUser | null) {
  authState.user = user
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AccountMenu />
      <RouterRoutes>
        <Route path="*" element={<LocationProbe />} />
      </RouterRoutes>
    </MemoryRouter>,
  )
}

describe("AccountMenu", () => {
  beforeEach(() => {
    signOutMutate.mockReset()
    signOutState.isPending = false
    authState.user = null
  })

  describe("avatar initials", () => {
    it("renders uppercased initials from name and lastName", () => {
      renderMenu(adminUser)

      expect(screen.getByText("DT")).toBeInTheDocument()
    })

    it("falls back to a single initial when only the first name is present", () => {
      renderMenu({ ...adminUser, lastName: "" })

      expect(screen.getByText("D")).toBeInTheDocument()
    })

    it("falls back to the email initial when no name is present", () => {
      renderMenu({ ...adminUser, name: "", lastName: "", email: "zoltan@vulkan.test" })

      expect(screen.getByText("Z")).toBeInTheDocument()
    })

    it("renders a neutral placeholder when neither name nor email is present", () => {
      renderMenu({ ...adminUser, name: "", lastName: "", email: "" })

      expect(screen.getByText("?")).toBeInTheDocument()
    })
  })

  describe("opening the menu", () => {
    it("reveals the greeting and the Sign out item when clicked", async () => {
      const user = userEvent.setup()
      renderMenu(adminUser)

      await user.click(screen.getByRole("button", { name: /account menu/i }))

      expect(
        await screen.findByText(/welcome back, demetrian!/i),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("menuitem", { name: /sign out/i }),
      ).toBeInTheDocument()
    })

    it("does not open on hover", async () => {
      const user = userEvent.setup()
      renderMenu(adminUser)

      await user.hover(screen.getByRole("button", { name: /account menu/i }))

      expect(
        screen.queryByText(/welcome back, demetrian!/i),
      ).not.toBeInTheDocument()
    })
  })

  describe("signing out", () => {
    it("calls the sign-out mutation and redirects to login on success", async () => {
      signOutMutate.mockImplementation((_input, options) => {
        options?.onSuccess?.()
      })
      const user = userEvent.setup()
      renderMenu(adminUser)

      await user.click(screen.getByRole("button", { name: /account menu/i }))
      await user.click(await screen.findByRole("menuitem", { name: /sign out/i }))

      expect(signOutMutate).toHaveBeenCalledTimes(1)
      await waitFor(() =>
        expect(screen.getByTestId("location")).toHaveTextContent(Routes.login),
      )
    })
  })

  describe("dismissal", () => {
    it("closes the menu when Escape is pressed", async () => {
      const user = userEvent.setup()
      renderMenu(adminUser)

      await user.click(screen.getByRole("button", { name: /account menu/i }))
      expect(
        await screen.findByText(/welcome back, demetrian!/i),
      ).toBeInTheDocument()

      await user.keyboard("{Escape}")

      await waitFor(() =>
        expect(
          screen.queryByText(/welcome back, demetrian!/i),
        ).not.toBeInTheDocument(),
      )
    })
  })
})
