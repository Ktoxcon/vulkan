import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Routes, Route } from "react-router"
import { EventDetailPage } from "@/features/events/pages/event-detail.page"
import { server } from "../../../msw/server"
import { getEvent, makeEvent } from "../../../msw/events.handlers"
import { getRosterNotFound } from "../../../msw/roster.handlers"
import { getEmailTemplateNotFound } from "../../../msw/email-template.handlers"
import { listInvitations, makeListView } from "../../../msw/invitations.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

describe("EventDetailPage epic-3 tabs", () => {
  it("renders the new Roster / Email Template / Invitations tabs alongside the existing ones", async () => {
    server.use(getEvent(makeEvent({ id: "e-1", status: "draft" })))
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /offerings/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /^roster$/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /email template/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /invitations/i })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /^edit$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /readiness/i })).not.toBeInTheDocument()
  })

  it("opens the Roster tab content", async () => {
    server.use(
      getEvent(makeEvent({ id: "e-1", status: "draft" })),
      getRosterNotFound(),
    )
    const user = userEvent.setup()
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })
    await user.click(screen.getByRole("tab", { name: /^roster$/i }))

    expect(await screen.findByText(/upload roster/i)).toBeInTheDocument()
  })

  it("opens the Email Template tab content", async () => {
    server.use(
      getEvent(makeEvent({ id: "e-1", status: "draft" })),
      getEmailTemplateNotFound(),
    )
    const user = userEvent.setup()
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })
    await user.click(screen.getByRole("tab", { name: /email template/i }))

    expect(await screen.findByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByText("Supported variables")).toBeInTheDocument()
  })

  it("opens the Invitations tab content", async () => {
    server.use(
      getEvent(makeEvent({ id: "e-1", status: "draft" })),
      listInvitations(() => makeListView()),
    )
    const user = userEvent.setup()
    renderDetail("e-1")

    await screen.findByRole("heading", { name: /annual forge expo/i })
    await user.click(screen.getByRole("tab", { name: /invitations/i }))

    expect(
      await screen.findByRole("button", { name: /generate invitations/i }),
    ).toBeInTheDocument()
  })
})
