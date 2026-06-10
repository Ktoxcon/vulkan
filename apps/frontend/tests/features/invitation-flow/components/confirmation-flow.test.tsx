import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { ConfirmationFlow } from "@/features/invitation-flow/components/confirmation-flow.component"
import { server } from "../../../msw/server"
import {
  confirm,
  confirmError,
  createReservation,
  createReservationFull,
  getDraft,
  getOfferings,
  makeConfirmationResult,
  makeDraftView,
  makeEvent,
  makeMultiDayEvent,
  makeReservation,
  productId,
  saveDraft,
  saveDraftRejectingInvalid,
  serviceId,
  validToken,
} from "../../../msw/invitation-flow.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"
import type {
  ClientContext,
  EventContext,
  FlowDraftData,
} from "@/features/invitation-flow/types/invitation-flow.types"

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

installRadixJsdomShims()

const client: ClientContext = {
  id: "c-1",
  name: "Vulcan Hestan",
  email: "vulcan@nocturne.test",
  company: "Forgemasters",
}

function renderFlow(
  event: EventContext = makeEvent(),
  hasDraft = false,
) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <ConfirmationFlow
          token={validToken}
          event={event}
          client={client}
          hasDraft={hasDraft}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function gotoInterests(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText(/seat held for/i, undefined, { timeout: 3000 })
  await user.click(screen.getByRole("button", { name: /continue/i }))
  await screen.findByText("Drakescale Plate")
}

describe("ConfirmationFlow", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
    server.use(saveDraft())
  })

  it("creates a reservation on mount and shows the seat-hold countdown", async () => {
    const capture = { count: 0 }
    server.use(
      createReservation(makeReservation(), { capture }),
      getOfferings(),
    )
    renderFlow()

    expect(await screen.findByText(/seat held for/i)).toBeInTheDocument()
    await waitFor(() => expect(capture.count).toBe(1))
  })

  it("shows the re-reserve prompt and blocks confirm when the hold has expired", async () => {
    server.use(
      createReservation(
        makeReservation({ expiresAt: new Date(Date.now() + 1200).toISOString() }),
      ),
      getOfferings(),
      getDraft(),
    )
    renderFlow()

    await screen.findByText(/seat held for/i, undefined, { timeout: 3000 })

    expect(
      await screen.findByText(/your seat hold expired/i, undefined, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /reserve again/i }),
    ).toBeInTheDocument()
  })

  it("shows the full notice when reservation returns 409 CAPACITY_REACHED", async () => {
    server.use(createReservationFull(), getOfferings())
    renderFlow()

    expect(await screen.findByText(/event is full/i)).toBeInTheDocument()
  })

  it("restores a split draft (productIds/serviceIds + attendanceDate) into the form", async () => {
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(
        makeDraftView(
          {
            firstName: "Forge",
            lastName: "Master",
            email: "forge@nocturne.test",
            attendanceDate: "2026-07-01",
            productIds: [productId],
            serviceIds: [serviceId],
          },
          "2026-06-05T00:00:00.000Z",
        ),
      ),
    )
    const user = userEvent.setup()
    renderFlow(makeEvent(), true)

    await screen.findByText(/seat held for/i, undefined, { timeout: 3000 })
    expect(screen.getByDisplayValue("Forge")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Master")).toBeInTheDocument()

    await gotoInterests(user)
    const plate = screen.getByText("Drakescale Plate").closest("label") as HTMLElement
    const fitting = screen.getByText("Armor Fitting").closest("label") as HTMLElement
    expect(within(plate).getByRole("checkbox")).toBeChecked()
    expect(within(fitting).getByRole("checkbox")).toBeChecked()
  })

  it("debounced autosave PUTs schema-valid partials (split ids) and tolerates a 400", async () => {
    const capture = { calls: [] as FlowDraftData[] }
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(),
      saveDraftRejectingInvalid(capture),
    )
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByText("Drakescale Plate"))

    await waitFor(
      () => expect(capture.calls.some((c) => c.productIds?.includes(productId))).toBe(true),
      { timeout: 3000 },
    )
    expect(toastError).not.toHaveBeenCalled()
  })

  it("validates step 1 before advancing (blank required field)", async () => {
    server.use(createReservation(), getOfferings(), getDraft())
    const user = userEvent.setup()
    renderFlow()

    await screen.findByText(/seat held for/i, undefined, { timeout: 3000 })
    await user.clear(screen.getByLabelText(/first name/i))
    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
    expect(screen.queryByText("Drakescale Plate")).not.toBeInTheDocument()
  })

  it("renders the attendance date read-only for a single-day event", async () => {
    server.use(createReservation(), getOfferings(), getDraft())
    renderFlow(makeEvent())

    await screen.findByText(/seat held for/i, undefined, { timeout: 3000 })
    const dateInput = screen.getByLabelText(/attendance date/i) as HTMLInputElement
    expect(dateInput).toHaveAttribute("readonly")
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("offers a date select for a multi-day event", async () => {
    server.use(createReservation(), getOfferings(), getDraft())
    renderFlow(makeMultiDayEvent())

    await screen.findByText(/seat held for/i, undefined, { timeout: 3000 })
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("supports multi-selecting interests", async () => {
    server.use(createReservation(), getOfferings(), getDraft())
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByText("Drakescale Plate"))
    await user.click(screen.getByText("Armor Fitting"))

    const plate = screen.getByText("Drakescale Plate").closest("label") as HTMLElement
    const fitting = screen.getByText("Armor Fitting").closest("label") as HTMLElement
    expect(within(plate).getByRole("checkbox")).toBeChecked()
    expect(within(fitting).getByRole("checkbox")).toBeChecked()
  })

  it("confirms with merged offeringIds and shows the success screen with interests", async () => {
    const capture = { bodies: [] as Array<Record<string, unknown>> }
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(),
      confirm(makeConfirmationResult(), capture),
    )
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByText("Drakescale Plate"))
    await user.click(screen.getByText("Armor Fitting"))
    await user.click(screen.getByRole("button", { name: /continue/i }))

    await screen.findByRole("button", { name: /confirm attendance/i })
    await user.click(screen.getByRole("button", { name: /confirm attendance/i }))

    expect(await screen.findByText(/you're confirmed/i)).toBeInTheDocument()
    expect(capture.bodies[0].offeringIds).toEqual([productId, serviceId])
    expect(screen.getByText("Drakescale Plate")).toBeInTheDocument()
    expect(screen.getByText("Armor Fitting")).toBeInTheDocument()
  })

  it("shows a friendly message when confirm returns ALREADY_CONFIRMED", async () => {
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(),
      confirmError("ALREADY_CONFIRMED", 409),
    )
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /confirm attendance/i }))

    expect(
      await screen.findByText(/this invitation has already been confirmed/i),
    ).toBeInTheDocument()
  })

  it("shows a friendly message and toast when confirm returns CAPACITY_REACHED", async () => {
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(),
      confirmError("CAPACITY_REACHED", 409),
    )
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /confirm attendance/i }))

    expect(
      await screen.findByText(/reached full capacity/i),
    ).toBeInTheDocument()
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("This event is now full."))
  })

  it("shows a friendly message when confirm returns RESERVATION_EXPIRED", async () => {
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(),
      confirmError("RESERVATION_EXPIRED", 409),
    )
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /confirm attendance/i }))

    expect(await screen.findByText(/your seat hold expired/i)).toBeInTheDocument()
  })

  it("shows a friendly message when confirm returns EMAIL_MISMATCH", async () => {
    server.use(
      createReservation(),
      getOfferings(),
      getDraft(),
      confirmError("EMAIL_MISMATCH", 409),
    )
    const user = userEvent.setup()
    renderFlow()

    await gotoInterests(user)
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /confirm attendance/i }))

    expect(
      await screen.findByText(/doesn't match the one on your invitation/i),
    ).toBeInTheDocument()
  })
})
