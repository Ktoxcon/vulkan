import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { EventLifecycleActions } from "@/features/events/components/event-lifecycle-actions.component"
import { server } from "../../../msw/server"
import {
  makeEvent,
  makeReadiness,
  patchEvent,
  patchEventError,
} from "../../../msw/events.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"
import type { SalesEvent } from "@/features/events/types/event.types"

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

installRadixJsdomShims()

function renderActions(event: SalesEvent, onNotReady?: () => void) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <EventLifecycleActions event={event} onNotReady={onNotReady} />
    </QueryClientProvider>,
  )
}

describe("EventLifecycleActions", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("renders only Launch for a draft event", () => {
    renderActions(makeEvent({ status: "draft" }))

    expect(screen.getByRole("button", { name: /launch/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument()
  })

  it("renders Pause and Close for an active event", () => {
    renderActions(makeEvent({ status: "active" }))

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^close$/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument()
  })

  it("renders Resume and Close for a paused event", () => {
    renderActions(makeEvent({ status: "paused" }))

    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^close$/i })).toBeInTheDocument()
  })

  it("renders nothing for a closed event", () => {
    renderActions(makeEvent({ status: "closed" }))

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("Launch on a NOT-READY event surfaces failing checks and calls onNotReady (no crash)", async () => {
    server.use(
      patchEventError("EVENT_NOT_READY", "Not ready.", 409, {
        checks: makeReadiness({ offeringsAssigned: false, rosterUploaded: false }).checks,
      }),
    )
    const onNotReady = vi.fn()
    const user = userEvent.setup()
    renderActions(makeEvent({ status: "draft" }), onNotReady)

    await user.click(screen.getByRole("button", { name: /launch/i }))

    await waitFor(() => expect(onNotReady).toHaveBeenCalled())
    expect(toastError).toHaveBeenCalled()
    const message = toastError.mock.calls[0][0] as string
    expect(message).toMatch(/offerings assigned/i)
    expect(message).toMatch(/client roster uploaded/i)
  })

  it("Launch success transitions and toasts", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(patchEvent((id) => makeEvent({ id, status: "active" }), capture))
    const user = userEvent.setup()
    renderActions(makeEvent({ id: "e-1", status: "draft" }))

    await user.click(screen.getByRole("button", { name: /launch/i }))

    await waitFor(() => expect(capture.body).toEqual({ status: "active" }))
    expect(toastSuccess).toHaveBeenCalledWith("Event launched")
  })

  it("Pause transitions to paused", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(patchEvent((id) => makeEvent({ id, status: "paused" }), capture))
    const user = userEvent.setup()
    renderActions(makeEvent({ id: "e-1", status: "active" }))

    await user.click(screen.getByRole("button", { name: /pause/i }))

    await waitFor(() => expect(capture.body).toEqual({ status: "paused" }))
    expect(toastSuccess).toHaveBeenCalledWith("Event paused")
  })

  it("Resume transitions a paused event back to active", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(patchEvent((id) => makeEvent({ id, status: "active" }), capture))
    const user = userEvent.setup()
    renderActions(makeEvent({ id: "e-1", status: "paused" }))

    await user.click(screen.getByRole("button", { name: /resume/i }))

    await waitFor(() => expect(capture.body).toEqual({ status: "active" }))
    expect(toastSuccess).toHaveBeenCalledWith("Event resumed")
  })

  it("Close shows a confirm dialog then transitions to closed on confirm", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(patchEvent((id) => makeEvent({ id, status: "closed" }), capture))
    const user = userEvent.setup()
    renderActions(makeEvent({ id: "e-1", status: "active" }))

    await user.click(screen.getByRole("button", { name: /^close$/i }))

    expect(await screen.findByText(/close this event\?/i)).toBeInTheDocument()
    expect(capture.body).toBeUndefined()

    await user.click(screen.getByRole("button", { name: /close event/i }))

    await waitFor(() => expect(capture.body).toEqual({ status: "closed" }))
    expect(toastSuccess).toHaveBeenCalledWith("Event closed")
  })
})
