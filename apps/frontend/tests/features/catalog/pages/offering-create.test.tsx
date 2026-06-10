import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { OfferingCreatePage } from "@/features/catalog/pages/offering-create.page"
import { server } from "../../../msw/server"
import {
  createOfferingConflict,
  createOfferingSuccess,
  makeOffering,
} from "../../../msw/offerings.handlers"
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
      <MemoryRouter initialEntries={["/catalog/new"]}>
        <Routes>
          <Route path="/catalog/new" element={<OfferingCreatePage />} />
          <Route path="/catalog" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/name/i), "Forge Hammer")
  await user.type(screen.getByLabelText(/base price/i), "300")
}

describe("OfferingCreatePage", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("creates an offering, toasts, and redirects to /catalog", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(
      createOfferingSuccess(
        capture,
        makeOffering({ id: "o-new", name: "Forge Hammer" }),
      ),
    )
    const user = userEvent.setup()
    renderCreate()

    await fillRequired(user)
    await user.click(screen.getByRole("button", { name: /create offering/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/catalog")
    })
    expect(toastSuccess).toHaveBeenCalledWith("Forge Hammer created")
    expect(capture.body?.name).toBe("Forge Hammer")
    expect(capture.body?.basePrice).toBe(300)
    expect(capture.body?.type).toBe("product")
  })

  it("shows an inline name error on 409 DUPLICATE_OFFERING and does not redirect", async () => {
    server.use(createOfferingConflict())
    const user = userEvent.setup()
    renderCreate()

    await fillRequired(user)
    await user.click(screen.getByRole("button", { name: /create offering/i }))

    expect(
      await screen.findByText(/an offering with this name and type already exists/i),
    ).toBeInTheDocument()
    expect(screen.queryByTestId("location")).not.toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it("blocks submit when the name is empty", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createOfferingSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/base price/i), "100")
    await user.click(screen.getByRole("button", { name: /create offering/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })

  it("blocks submit when the base price is not greater than zero", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createOfferingSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/name/i), "Zero Priced")
    await user.type(screen.getByLabelText(/base price/i), "0")
    await user.click(screen.getByRole("button", { name: /create offering/i }))

    expect(
      await screen.findByText(/base price must be greater than 0/i),
    ).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })
})
