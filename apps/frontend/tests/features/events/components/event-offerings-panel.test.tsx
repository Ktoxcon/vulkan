import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { EventOfferingsPanel } from "@/features/events/components/event-offerings-panel.component"
import { server } from "../../../msw/server"
import {
  assignOfferingSuccess,
  listCatalogPaged,
  listEventOfferings,
  listEventOfferingsError,
  makeAssignedOffering,
  makeOffering,
  makeOfferings,
  removeOfferingSuccess,
} from "../../../msw/events.handlers"
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

function renderPanel(eventId = "e-1") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <EventOfferingsPanel eventId={eventId} />
    </QueryClientProvider>,
  )
}

describe("EventOfferingsPanel", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("renders the assigned offerings list", async () => {
    server.use(
      listEventOfferings([
        makeAssignedOffering("eo-1", { id: "o-1", name: "Drakescale Plate" }),
        makeAssignedOffering("eo-2", { id: "o-2", name: "Forge Hammer" }),
      ]),
    )
    renderPanel()

    expect(await screen.findByText("Drakescale Plate")).toBeInTheDocument()
    expect(screen.getByText("Forge Hammer")).toBeInTheDocument()
  })

  it("shows an empty state when nothing is assigned", async () => {
    server.use(listEventOfferings([]))
    renderPanel()

    expect(
      await screen.findByText(/no offerings assigned yet/i),
    ).toBeInTheDocument()
  })

  it("shows an error state when the assigned list fails", async () => {
    server.use(listEventOfferingsError())
    renderPanel()

    expect(
      await screen.findByText(/failed to load assigned offerings/i),
    ).toBeInTheDocument()
  })

  it("removes an assigned offering by its join-row id", async () => {
    server.use(
      listEventOfferings([
        makeAssignedOffering("eo-7", { id: "o-7", name: "Cinder Blade" }),
      ]),
    )
    const capture: { eventOfferingId?: string; eventId?: string } = {}
    server.use(removeOfferingSuccess(capture))
    const user = userEvent.setup()
    renderPanel("e-1")

    await screen.findByText("Cinder Blade")
    await user.click(screen.getByRole("button", { name: /remove/i }))

    await waitFor(() => expect(capture.eventOfferingId).toBe("eo-7"))
    expect(capture.eventId).toBe("e-1")
    expect(toastSuccess).toHaveBeenCalledWith("Cinder Blade removed")
  })

  it("opens the picker and assigns an active catalog offering", async () => {
    server.use(listEventOfferings([]))
    server.use(listCatalogPaged([makeOffering({ id: "o-9", name: "Magma Cloak" })]))
    const capture: { body?: Record<string, unknown>; eventId?: string } = {}
    server.use(assignOfferingSuccess(capture))
    const user = userEvent.setup()
    renderPanel("e-1")

    await screen.findByText(/no offerings assigned yet/i)
    await user.click(screen.getByRole("button", { name: /add offerings/i }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Magma Cloak")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: /assign/i }))

    await waitFor(() => expect(capture.body).toEqual({ offeringId: "o-9" }))
    expect(capture.eventId).toBe("e-1")
    expect(toastSuccess).toHaveBeenCalledWith("Magma Cloak assigned")
  })

  it("hides already-assigned offerings from the picker", async () => {
    server.use(
      listEventOfferings([
        makeAssignedOffering("eo-1", { id: "o-1", name: "Already In" }),
      ]),
    )
    server.use(
      listCatalogPaged([
        makeOffering({ id: "o-1", name: "Already In" }),
        makeOffering({ id: "o-2", name: "Available One" }),
      ]),
    )
    const user = userEvent.setup()
    renderPanel("e-1")

    await screen.findByText("Already In")
    await user.click(screen.getByRole("button", { name: /add offerings/i }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Available One")).toBeInTheDocument()
    expect(within(dialog).queryByText("Already In")).not.toBeInTheDocument()
  })

  it("handles an empty catalog in the picker", async () => {
    server.use(listEventOfferings([]))
    server.use(listCatalogPaged([]))
    const user = userEvent.setup()
    renderPanel("e-1")

    await screen.findByText(/no offerings assigned yet/i)
    await user.click(screen.getByRole("button", { name: /add offerings/i }))

    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText(/no active offerings exist in the catalog yet/i),
    ).toBeInTheDocument()
  })

  it("paginates the catalog when more than one page exists", async () => {
    server.use(listEventOfferings([]))
    server.use(listCatalogPaged(makeOfferings(15)))
    const user = userEvent.setup()
    renderPanel("e-1")

    await screen.findByText(/no offerings assigned yet/i)
    await user.click(screen.getByRole("button", { name: /add offerings/i }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/page 1 of 2/i)).toBeInTheDocument()
    expect(within(dialog).getByText("Offering 1")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: /next/i }))

    expect(await within(dialog).findByText("Offering 11")).toBeInTheDocument()
    expect(within(dialog).getByText(/page 2 of 2/i)).toBeInTheDocument()
  })
})
