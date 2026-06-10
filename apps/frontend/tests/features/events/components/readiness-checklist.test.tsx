import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReadinessChecklist } from "@/features/events/components/readiness-checklist.component"
import { server } from "../../../msw/server"
import {
  getReadiness,
  getReadinessError,
  makeReadiness,
} from "../../../msw/events.handlers"
import { createTestQueryClient } from "../../../helpers/render"

function renderChecklist(eventId = "e-1") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ReadinessChecklist eventId={eventId} />
    </QueryClientProvider>,
  )
}

describe("ReadinessChecklist", () => {
  it("renders all eight checks with pass/fail icons", async () => {
    server.use(
      getReadiness(
        makeReadiness({
          offeringsAssigned: false,
          rosterUploaded: false,
          inviteTokensReady: false,
        }),
      ),
    )
    renderChecklist()

    expect(await screen.findByText(/not ready to launch/i)).toBeInTheDocument()
    expect(screen.getByText(/event details configured/i)).toBeInTheDocument()
    expect(screen.getByText(/offerings assigned/i)).toBeInTheDocument()
    expect(screen.getByText(/email template configured/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText("Failed")).toHaveLength(3)
    expect(screen.getAllByLabelText("Passed")).toHaveLength(5)
  })

  it("shows a ready header when every check passes", async () => {
    server.use(getReadiness(makeReadiness()))
    renderChecklist()

    expect(await screen.findByText(/ready to launch/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText("Passed")).toHaveLength(8)
    expect(screen.queryAllByLabelText("Failed")).toHaveLength(0)
  })

  it("renders an error state when readiness fails to load", async () => {
    server.use(getReadinessError())
    renderChecklist()

    expect(
      await screen.findByText(/failed to load readiness checks/i),
    ).toBeInTheDocument()
  })
})
