import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { PortfoliosTable } from "@/features/portfolios/components/portfolios-table.component"
import { makeListRow, makeListRows } from "../../../msw/portfolios.handlers"

function renderTable(rows: Parameters<typeof PortfoliosTable>[0]["portfolios"]) {
  return render(
    <MemoryRouter>
      <PortfoliosTable portfolios={rows} />
    </MemoryRouter>,
  )
}

describe("PortfoliosTable", () => {
  it("renders an empty state when there are no portfolios", () => {
    renderTable([])

    expect(screen.getByText(/no portfolios generated yet/i)).toBeInTheDocument()
  })

  it("renders a row per portfolio with formatted money", () => {
    renderTable(
      makeListRows(2).map((row, index) =>
        makeListRow({
          ...row,
          totalBeforeDiscount: index === 0 ? "1200.00" : "800.50",
          totalAfterDiscount: index === 0 ? "1000.00" : "700.25",
        }),
      ),
    )

    expect(screen.getAllByText("Client 1").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Client 2").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Q1,200.00").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Q1,000.00").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Q700.25").length).toBeGreaterThanOrEqual(1)
  })

  it("links each row to the portfolio detail route", () => {
    renderTable([makeListRow({ id: "p-42", clientName: "Solar" })])

    const links = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/portfolios/p-42")
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it("shows the status label", () => {
    renderTable([makeListRow({ id: "p-1", status: "reviewed" })])

    expect(screen.getAllByText("Reviewed").length).toBeGreaterThanOrEqual(1)
  })
})
