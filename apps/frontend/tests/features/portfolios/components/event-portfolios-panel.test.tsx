import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { EventPortfoliosPanel } from "@/features/events/components/event-portfolios-panel.component"
import { server } from "../../../msw/server"
import {
  listPortfolios,
  listPortfoliosError,
  makeListRows,
} from "../../../msw/portfolios.handlers"
import { createTestQueryClient } from "../../../helpers/render"

function renderPanel(eventId: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <EventPortfoliosPanel eventId={eventId} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("EventPortfoliosPanel", () => {
  it("renders the portfolio rows for the event", async () => {
    server.use(listPortfolios(makeListRows(2)))
    renderPanel("e-1")

    expect(
      await screen.findAllByText("Client 1"),
    ).not.toHaveLength(0)
    expect(screen.getAllByText("Client 2").length).toBeGreaterThanOrEqual(1)
  })

  it("renders the empty state when there are none", async () => {
    server.use(listPortfolios([]))
    renderPanel("e-1")

    expect(
      await screen.findByText(/no portfolios generated yet/i),
    ).toBeInTheDocument()
  })

  it("renders an error notice when the list fails", async () => {
    server.use(listPortfoliosError())
    renderPanel("e-1")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to load portfolios/i,
    )
  })
})
