import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route } from "react-router"
import { EventDetailPage } from "@/features/events/pages/event-detail.page"
import { server } from "../../../msw/server"
import {
  getEvent,
  getEventNotFound,
  getReadiness,
  listEventOfferings,
  makeAssignedOffering,
  makeEvent,
  makeReadiness,
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

function renderDetail(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/events/${id}`]}>
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("EventDetailPage", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("loads and renders the event name and status", async () => {
    server.use(getEvent(makeEvent({ id: "e-1", name: "Forge Expo", status: "draft" })))
    renderDetail("e-1")

    expect(
      await screen.findByRole("heading", { name: "Forge Expo" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Draft")).toBeInTheDocument()
  })

  it("shows a not-found state on 404", async () => {
    server.use(getEventNotFound("missing"))
    renderDetail("missing")

    expect(await screen.findByText(/event not found/i)).toBeInTheDocument()
  })

  it("renders the Edit Event button linking to the edit page", async () => {
    server.use(getEvent(makeEvent({ id: "e-1", status: "active" })))
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })

    const editLink = screen.getByRole("link", { name: /edit event/i })
    expect(editLink).toHaveAttribute("href", "/events/e-1/edit")
  })

  it("does not render Edit or Readiness tabs", async () => {
    server.use(getEvent(makeEvent({ id: "e-1", status: "draft" })))
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })

    expect(screen.queryByRole("tab", { name: /^edit$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /readiness/i })).not.toBeInTheDocument()
  })

  it("renders readiness pass/fail per check in the Overview tab", async () => {
    server.use(
      getEvent(makeEvent({ id: "e-1", status: "draft" })),
      getReadiness(makeReadiness({ offeringsAssigned: false, rosterUploaded: false })),
    )
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })

    expect(await screen.findByText(/not ready to launch/i)).toBeInTheDocument()
    expect(screen.getByText(/event details configured/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText("Failed").length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByLabelText("Passed").length).toBeGreaterThanOrEqual(1)
  })

  it("Offerings tab lists assigned offerings", async () => {
    server.use(
      getEvent(makeEvent({ id: "e-1", status: "draft" })),
      listEventOfferings([
        makeAssignedOffering("eo-o-1", { id: "o-1", name: "Drakescale Plate" }),
        makeAssignedOffering("eo-o-2", { id: "o-2", name: "Forge Hammer" }),
      ]),
    )
    const user = userEvent.setup()
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })
    await user.click(screen.getByRole("tab", { name: /offerings/i }))

    expect(await screen.findByText("Drakescale Plate")).toBeInTheDocument()
    expect(screen.getByText("Forge Hammer")).toBeInTheDocument()
  })
})
