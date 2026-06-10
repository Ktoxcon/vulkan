import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { EventEditPage } from "@/features/events/pages/event-edit.page"
import { server } from "../../../msw/server"
import {
  getEvent,
  getEventNotFound,
  makeEvent,
  patchEvent,
} from "../../../msw/events.handlers"
import { createTestQueryClient } from "../../../helpers/render"

const toastSuccess = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
  },
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderEdit(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/events/${id}/edit`]}>
        <Routes>
          <Route path="/events/:eventId/edit" element={<EventEditPage />} />
          <Route path="/events/:eventId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("EventEditPage", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("renders the form populated from the loaded event", async () => {
    server.use(
      getEvent(makeEvent({ id: "e-1", name: "Forge Expo", capacity: 250 })),
    )
    renderEdit("e-1")

    expect(
      await screen.findByRole("heading", { name: /edit forge expo/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Forge Expo")
    expect(screen.getByLabelText(/^capacity$/i)).toHaveValue(250)
  })

  it("saves via the update mutation, toasts, and navigates back to the detail page", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      getEvent(makeEvent({ id: "e-1", name: "Forge Expo", status: "draft" })),
      patchEvent(
        (id, body) => makeEvent({ id, name: body.name as string }),
        capture,
      ),
    )
    const user = userEvent.setup()
    renderEdit("e-1")

    const nameInput = await screen.findByLabelText(/^name$/i)
    await user.clear(nameInput)
    await user.type(nameInput, "Renamed Expo")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/events/e-1")
    })
    expect(capture.id).toBe("e-1")
    expect(capture.body?.name).toBe("Renamed Expo")
    expect(toastSuccess).toHaveBeenCalledWith("Renamed Expo updated")
  })

  it("shows a not-found state when the event is missing", async () => {
    server.use(getEventNotFound("missing"))
    renderEdit("missing")

    expect(await screen.findByText(/event not found/i)).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /back to events/i }),
    ).toBeInTheDocument()
  })
})
