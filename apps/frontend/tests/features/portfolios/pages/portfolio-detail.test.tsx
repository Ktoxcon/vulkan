import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router"
import { http, HttpResponse } from "msw"
import { PortfolioDetailPage } from "@/features/portfolios/pages/portfolio-detail.page"
import { server } from "../../../msw/server"
import { apiUrl } from "../../../msw/handlers"
import {
  exportPortfolio,
  getPortfolio,
  getPortfolioError,
  makeDetail,
  makeItem,
  makePortfolioRow,
  updatePortfolioStatus,
} from "../../../msw/portfolios.handlers"
import { createTestQueryClient } from "../../../helpers/render"
import { installRadixJsdomShims } from "../../../helpers/radix"

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

installRadixJsdomShims()

function renderDetail(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/portfolios/${id}`]}>
        <Routes>
          <Route
            path="/portfolios/:portfolioId"
            element={<PortfolioDetailPage />}
          />
          <Route path="/events" element={<div>Events list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("PortfolioDetailPage", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("loads the client header, items and totals", async () => {
    server.use(
      getPortfolio(
        makeDetail({
          id: "p-1",
          client: { name: "Vulkan Hestan", email: "vulkan@nocturne.test" },
          event: { id: "e-1", name: "Annual Forge Expo" },
          items: [
            makeItem({
              id: "pi-1",
              offeringName: "Drakescale Plate",
              offeringType: "product",
              basePrice: "500.00",
              finalPrice: "450.00",
            }),
          ],
          totalBeforeDiscount: "1200.00",
          totalAfterDiscount: "1000.00",
        }),
      ),
    )
    renderDetail("p-1")

    expect(
      await screen.findByRole("heading", { name: "Vulkan Hestan" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Annual Forge Expo")).toBeInTheDocument()
    expect(screen.getByText("Drakescale Plate")).toBeInTheDocument()
    expect(screen.getAllByText("Q1,000.00").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Q1,200.00").length).toBeGreaterThanOrEqual(1)
  })

  it("shows a not-found state on 404 PORTFOLIO_NOT_FOUND", async () => {
    server.use(
      getPortfolioError("missing", "PORTFOLIO_NOT_FOUND", "Not found.", 404),
    )
    renderDetail("missing")

    expect(await screen.findByText(/portfolio not found/i)).toBeInTheDocument()
  })

  it("shows a forbidden notice on 403 PORTFOLIO_ACCESS_DENIED", async () => {
    server.use(
      getPortfolioError("p-other", "PORTFOLIO_ACCESS_DENIED", "Denied.", 403),
    )
    renderDetail("p-other")

    expect(
      await screen.findByText(/do not have access to this portfolio/i),
    ).toBeInTheDocument()
  })

  it("triggers a CSV download when Export CSV is clicked", async () => {
    const capture: { requested?: boolean } = {}
    server.use(
      getPortfolio(makeDetail({ id: "p-1" })),
      exportPortfolio("p-1", "a,b\n1,2\n", capture),
    )
    const createUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:csv")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})
    renderDetail("p-1")

    await screen.findByRole("heading", { name: /vulkan hestan/i })
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /export csv/i }))

    await waitFor(() => expect(capture.requested).toBe(true))
    expect(createUrl).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
  })

  it("advances the status and the refetched detail reflects the new badge", async () => {
    let currentStatus = "draft"
    server.use(
      http.get(apiUrl("/portfolios/p-1"), () =>
        HttpResponse.json({
          success: true,
          data: makeDetail({
            id: "p-1",
            eventId: "e-1",
            status: currentStatus as never,
          }),
        }),
      ),
      updatePortfolioStatus((id, next) => {
        currentStatus = next
        return makePortfolioRow({ id, eventId: "e-1", status: next as never })
      }),
    )
    renderDetail("p-1")

    await screen.findByRole("heading", { name: /vulkan hestan/i })
    expect(screen.getByText("Draft")).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /mark reviewed/i }))
    await user.click(screen.getByRole("button", { name: /^confirm$/i }))

    await waitFor(() => expect(screen.getByText("Reviewed")).toBeInTheDocument())
  })
})
