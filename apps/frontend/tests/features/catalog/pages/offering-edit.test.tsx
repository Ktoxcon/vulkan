import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { OfferingEditPage } from "@/features/catalog/pages/offering-edit.page"
import { server } from "../../../msw/server"
import {
  getOffering,
  getOfferingNotFound,
  makeOffering,
  patchOffering,
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

function renderEdit(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/catalog/${id}`]}>
        <Routes>
          <Route path="/catalog/:offeringId" element={<OfferingEditPage />} />
          <Route path="/catalog" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("OfferingEditPage", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("renders a not-found state on 404", async () => {
    server.use(getOfferingNotFound("missing"))
    renderEdit("missing")

    expect(await screen.findByText(/offering not found/i)).toBeInTheDocument()
  })

  it("loads the offering with the type read-only and updates editable fields", async () => {
    const target = makeOffering({
      id: "o-9",
      type: "service",
      name: "Old Service",
      description: "Old description",
      basePrice: "150.00",
      isActive: true,
    })
    server.use(getOffering(target))
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      patchOffering(
        (id, body) =>
          makeOffering({
            id,
            type: "service",
            name: (body.name as string) ?? "Old Service",
            basePrice: "150.00",
          }),
        capture,
      ),
    )

    const user = userEvent.setup()
    renderEdit("o-9")

    const nameField = await screen.findByLabelText(/name/i)
    await waitFor(() => expect(nameField).toHaveValue("Old Service"))

    const typeField = screen.getByLabelText(/type/i)
    expect(typeField).toHaveValue("Service")
    expect(typeField).toBeDisabled()

    await user.clear(nameField)
    await user.type(nameField, "Renamed Service")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/catalog")
    })
    expect(capture.id).toBe("o-9")
    expect(capture.body?.name).toBe("Renamed Service")
    expect(capture.body).not.toHaveProperty("type")
    expect(toastSuccess).toHaveBeenCalled()
  })
})
