import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route, useLocation } from "react-router"
import { EventCreatePage } from "@/features/events/pages/event-create.page"
import { server } from "../../../msw/server"
import { createEventSuccess, makeEvent } from "../../../msw/events.handlers"
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

function renderCreate() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/events/new"]}>
        <Routes>
          <Route path="/events/new" element={<EventCreatePage />} />
          <Route path="/events/:eventId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function setDate(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  value: string,
) {
  const input = screen.getByLabelText(label)
  await user.clear(input)
  await user.type(input, value)
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name$/i), "Forge Expo")
  await setDate(user, /registration start/i, "2026-07-01T09:00")
  await setDate(user, /registration end/i, "2026-08-01T09:00")
  await setDate(user, /^event start$/i, "2026-09-01T09:00")
  await setDate(user, /event end/i, "2026-09-02T09:00")
}

describe("EventCreatePage", () => {
  beforeEach(() => toastSuccess.mockReset())

  it("creates an event, toasts, and redirects to the detail page", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(
      createEventSuccess(capture, makeEvent({ id: "e-new", name: "Forge Expo" })),
    )
    const user = userEvent.setup()
    renderCreate()

    await fillValid(user)
    await user.click(screen.getByRole("button", { name: /create event/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/events/e-new")
    })
    expect(toastSuccess).toHaveBeenCalledWith("Forge Expo created")
    expect(capture.body?.name).toBe("Forge Expo")
    expect(typeof capture.body?.eventStartDate).toBe("string")
  })

  it("blocks submit when registration end is not after registration start", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createEventSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/^name$/i), "Bad Dates")
    await setDate(user, /registration start/i, "2026-08-01T09:00")
    await setDate(user, /registration end/i, "2026-07-01T09:00")
    await setDate(user, /^event start$/i, "2026-09-01T09:00")
    await user.click(screen.getByRole("button", { name: /create event/i }))

    expect(
      await screen.findByText(/registration end must be after registration start/i),
    ).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })

  it("blocks submit when registration ends after the event starts", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createEventSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/^name$/i), "Reg After Start")
    await setDate(user, /registration start/i, "2026-07-01T09:00")
    await setDate(user, /registration end/i, "2026-09-15T09:00")
    await setDate(user, /^event start$/i, "2026-09-01T09:00")
    await user.click(screen.getByRole("button", { name: /create event/i }))

    expect(
      await screen.findByText(/registration must end on or before the event starts/i),
    ).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })

  it("blocks submit when the event end is before the event start", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createEventSuccess(capture))
    const user = userEvent.setup()
    renderCreate()

    await user.type(screen.getByLabelText(/^name$/i), "End Before Start")
    await setDate(user, /registration start/i, "2026-07-01T09:00")
    await setDate(user, /registration end/i, "2026-08-01T09:00")
    await setDate(user, /^event start$/i, "2026-09-10T09:00")
    await setDate(user, /event end/i, "2026-09-01T09:00")
    await user.click(screen.getByRole("button", { name: /create event/i }))

    expect(
      await screen.findByText(/event end must be on or after the event start/i),
    ).toBeInTheDocument()
    expect(capture.body).toBeUndefined()
  })
})
