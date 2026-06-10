import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router"
import { InvitationPage } from "@/features/invitation-flow/pages/invitation.page"
import { server } from "../../../msw/server"
import {
  createReservation,
  getOfferings,
  makeResolution,
  resolveToken,
  resolveTokenInvalid,
  validToken,
} from "../../../msw/invitation-flow.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

installRadixJsdomShims()

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/invitation/${validToken}`]}>
        <Routes>
          <Route path="/invitation/:token" element={<InvitationPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("InvitationPage", () => {
  it("renders the wizard for an eligible token", async () => {
    server.use(
      resolveToken(makeResolution()),
      createReservation(),
      getOfferings(),
    )
    renderPage()

    expect(await screen.findByRole("button", { name: /continue/i })).toBeInTheDocument()
  })

  it("shows the invalid screen when resolution REJECTS (unknown token)", async () => {
    server.use(resolveTokenInvalid())
    renderPage()

    expect(await screen.findByText(/invitation not found/i)).toBeInTheDocument()
  })

  it("shows the already-confirmed success view", async () => {
    server.use(
      resolveToken(
        makeResolution({
          confirmation: { confirmed: true, confirmedAt: "2026-06-05T00:00:00.000Z" },
          eligible: false,
          reason: "ALREADY_CONFIRMED",
        }),
      ),
    )
    renderPage()

    expect(await screen.findByText(/you're confirmed/i)).toBeInTheDocument()
  })

  it("shows the registration-closed notice", async () => {
    server.use(
      resolveToken(makeResolution({ eligible: false, reason: "REGISTRATION_CLOSED" })),
    )
    renderPage()

    expect(await screen.findByText(/registration closed/i)).toBeInTheDocument()
  })

  it("shows the registration-not-started notice", async () => {
    server.use(
      resolveToken(
        makeResolution({ eligible: false, reason: "REGISTRATION_NOT_STARTED" }),
      ),
    )
    renderPage()

    expect(await screen.findByText(/registration not open yet/i)).toBeInTheDocument()
  })

  it("shows the paused notice", async () => {
    server.use(resolveToken(makeResolution({ eligible: false, reason: "EVENT_PAUSED" })))
    renderPage()

    expect(await screen.findByText(/registration paused/i)).toBeInTheDocument()
  })

  it("shows the capacity-reached notice", async () => {
    server.use(
      resolveToken(makeResolution({ eligible: false, reason: "CAPACITY_REACHED" })),
    )
    renderPage()

    expect(await screen.findByText(/event is full/i)).toBeInTheDocument()
  })
})
