import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route } from "react-router"
import { EventsPage } from "@/features/events/pages/events.page"
import { server } from "../../../msw/server"
import {
  listEventsError,
  listEventsPaged,
  makeEvents,
} from "../../../msw/events.handlers"
import { createTestQueryClient } from "../../../helpers/render"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderEvents() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/events"]}>
        <Routes>
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<div>New event form</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("EventsPage", () => {
  it("renders the paged list and the count summary", async () => {
    server.use(listEventsPaged(makeEvents(3)))
    renderEvents()

    expect(await screen.findByRole("heading", { name: "Events" })).toBeInTheDocument()
    expect(await screen.findByText("Event 1")).toBeInTheDocument()
    expect(screen.getByText(/3 events · page 1 of 1/i)).toBeInTheDocument()
  })

  it("paginates forward and backward through the list", async () => {
    const capture: { limit?: number; offset?: number } = {}
    server.use(listEventsPaged(makeEvents(25), capture))
    const user = userEvent.setup()
    renderEvents()

    await screen.findByText("Event 1")
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /next/i }))

    expect(await screen.findByText("Event 11")).toBeInTheDocument()
    await waitFor(() => expect(capture.offset).toBe(10))
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
    expect(screen.queryByText("Event 1")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /previous/i }))

    expect(await screen.findByText("Event 1")).toBeInTheDocument()
    await waitFor(() => expect(capture.offset).toBe(0))
  })

  it("shows an empty state when there are no events", async () => {
    server.use(listEventsPaged([]))
    renderEvents()

    expect(await screen.findByText(/no events found/i)).toBeInTheDocument()
  })

  it("shows an error state when the list fails", async () => {
    server.use(listEventsError())
    renderEvents()

    expect(await screen.findByText(/failed to load events/i)).toBeInTheDocument()
  })

  it("links to the create page", async () => {
    server.use(listEventsPaged(makeEvents(1)))
    renderEvents()

    const link = await screen.findByRole("link", { name: /new event/i })
    expect(link).toHaveAttribute("href", "/events/new")
  })

  it("navigates to the detail page on row click", async () => {
    server.use(listEventsPaged(makeEvents(2)))
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/events"]}>
          <Routes>
            <Route path="/events" element={<EventsPage />} />
            <Route
              path="/events/:eventId"
              element={<div data-testid="detail">detail</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const row = (await screen.findByText("Event 1")).closest("tr") as HTMLElement
    await user.click(within(row).getByText("Event 1"))

    expect(await screen.findByTestId("detail")).toBeInTheDocument()
  })
})
