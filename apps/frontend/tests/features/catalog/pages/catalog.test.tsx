import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { CatalogPage } from "@/features/catalog/pages/catalog.page"
import { server } from "../../../msw/server"
import {
  deleteOffering,
  listOfferingsPaged,
  makeOffering,
  makeOfferings,
  patchOffering,
} from "../../../msw/offerings.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

installRadixJsdomShims()

function renderCatalog() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/catalog"]}>
        <CatalogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("CatalogPage", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("lists offerings and defaults to the active filter (isActive=true)", async () => {
    const capture: { isActive?: string | null } = {}
    server.use(
      listOfferingsPaged(
        [
          makeOffering({ id: "o-1", name: "Drakescale Plate", isActive: true }),
          makeOffering({ id: "o-2", name: "Forge Hammer", isActive: true }),
        ],
        capture,
      ),
    )
    renderCatalog()

    expect(await screen.findByText("Drakescale Plate")).toBeInTheDocument()
    expect(screen.getByText("Forge Hammer")).toBeInTheDocument()
    await waitFor(() => expect(capture.isActive).toBe("true"))
  })

  it("formats the base price in quetzales from the numeric string", async () => {
    server.use(
      listOfferingsPaged([
        makeOffering({ id: "o-1", name: "Plate", basePrice: "1200.00" }),
      ]),
    )
    renderCatalog()

    expect(await screen.findByText("Q1,200.00")).toBeInTheDocument()
  })

  it("filters by type through the type select", async () => {
    const capture: { type?: string | null } = {}
    server.use(listOfferingsPaged(makeOfferings(6), capture))
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Offering 1")

    await user.click(screen.getByRole("combobox", { name: /type/i }))
    const listbox = await screen.findByRole("listbox")
    await user.click(within(listbox).getByRole("option", { name: "Service" }))

    await waitFor(() => expect(capture.type).toBe("service"))
  })

  it("sends isActive=false when the status filter is set to inactive", async () => {
    const capture: { isActive?: string | null } = {}
    server.use(listOfferingsPaged(makeOfferings(4), capture))
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Offering 1")

    await user.click(screen.getByRole("combobox", { name: /status/i }))
    const listbox = await screen.findByRole("listbox")
    await user.click(within(listbox).getByRole("option", { name: "Inactive" }))

    await waitFor(() => expect(capture.isActive).toBe("false"))
  })

  it("omits isActive when the status filter is set to all", async () => {
    const capture: { isActive?: string | null } = {}
    server.use(listOfferingsPaged(makeOfferings(4), capture))
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Offering 1")

    await user.click(screen.getByRole("combobox", { name: /status/i }))
    const listbox = await screen.findByRole("listbox")
    await user.click(within(listbox).getByRole("option", { name: "All" }))

    await waitFor(() => expect(capture.isActive).toBeNull())
  })

  it("debounces the search input and forwards it as the search query param", async () => {
    const capture: { search?: string | null } = {}
    server.use(listOfferingsPaged(makeOfferings(5), capture))
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Offering 1")

    await user.type(screen.getByLabelText(/search/i), "hammer")

    await waitFor(() => expect(capture.search).toBe("hammer"), { timeout: 2000 })
  })

  it("paginates to the next page (offset advances by the page size)", async () => {
    const capture: { offset?: number } = {}
    server.use(listOfferingsPaged(makeOfferings(15), capture))
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Offering 1")
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /next/i }))

    await waitFor(() => expect(capture.offset).toBe(10))
    expect(await screen.findByText("Offering 11")).toBeInTheDocument()
  })

  it("deactivates an active offering after confirming, flipping its status", async () => {
    let activeFlag = true
    server.use(
      listOfferingsPaged([
        makeOffering({ id: "o-1", name: "Plate", isActive: true }),
      ]),
      deleteOffering((id) => {
        activeFlag = false
        return makeOffering({ id, name: "Plate", isActive: activeFlag })
      }),
    )
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Plate")
    const row = screen.getByText("Plate").closest("tr") as HTMLElement
    expect(within(row).getByText("Active")).toBeInTheDocument()

    await user.click(within(row).getByRole("button", { name: /deactivate/i }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: /deactivate/i }))

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Plate deactivated"),
    )
  })

  it("reactivates an inactive offering via PATCH { isActive: true }", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      listOfferingsPaged([
        makeOffering({ id: "o-1", name: "Old Plate", isActive: false }),
      ]),
      patchOffering(
        (id) => makeOffering({ id, name: "Old Plate", isActive: true }),
        capture,
      ),
    )
    const user = userEvent.setup()
    renderCatalog()

    await screen.findByText("Old Plate")
    const row = screen.getByText("Old Plate").closest("tr") as HTMLElement
    expect(within(row).getByText("Inactive")).toBeInTheDocument()

    await user.click(within(row).getByRole("button", { name: /reactivate/i }))

    await waitFor(() => expect(capture.id).toBe("o-1"))
    expect(capture.body).toEqual({ isActive: true })
    expect(toastSuccess).toHaveBeenCalledWith("Old Plate reactivated")
  })

  it("renders an empty state when there are no offerings", async () => {
    server.use(listOfferingsPaged([]))
    renderCatalog()

    expect(await screen.findByText(/no offerings found/i)).toBeInTheDocument()
  })
})
