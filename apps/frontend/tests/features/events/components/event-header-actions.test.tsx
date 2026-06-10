import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { EventHeaderActions } from "@/features/events/components/event-header-actions.component"
import { makeEvent } from "../../../msw/events.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"
import type { SalesEvent } from "@/features/events/types/event.types"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

installRadixJsdomShims()

function renderHeader(event: SalesEvent) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <EventHeaderActions event={event} editHref={`/events/${event.id}/edit`} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("EventHeaderActions", () => {
  it("renders the Edit Event button linking to the edit page", () => {
    renderHeader(makeEvent({ id: "e-1", status: "draft" }))

    const editLink = screen.getByRole("link", { name: /edit event/i })
    expect(editLink).toHaveAttribute("href", "/events/e-1/edit")
  })

  it("renders Launch plus Edit for a draft event", () => {
    renderHeader(makeEvent({ id: "e-1", status: "draft" }))

    expect(screen.getByRole("button", { name: /launch/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /edit event/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^close$/i })).not.toBeInTheDocument()
  })

  it("renders Pause and Close plus Edit for an active event", () => {
    renderHeader(makeEvent({ id: "e-1", status: "active" }))

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^close$/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /edit event/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument()
  })

  it("renders Resume and Close plus Edit for a paused event", () => {
    renderHeader(makeEvent({ id: "e-1", status: "paused" }))

    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^close$/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /edit event/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument()
  })

  it("renders only the Edit Event button for a closed event", () => {
    renderHeader(makeEvent({ id: "e-1", status: "closed" }))

    expect(screen.getByRole("link", { name: /edit event/i })).toHaveAttribute(
      "href",
      "/events/e-1/edit",
    )
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^close$/i })).not.toBeInTheDocument()
  })
})
