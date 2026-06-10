import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { PortfolioStatusActions } from "@/features/portfolios/components/portfolio-status-actions.component"
import type { PortfolioDetail } from "@/features/portfolios/types/portfolio.types"
import { server } from "../../../msw/server"
import {
  makeDetail,
  makePortfolioRow,
  updatePortfolioStatus,
  updatePortfolioStatusError,
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

function renderActions(portfolio: PortfolioDetail) {
  const queryClient = createTestQueryClient()
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <PortfolioStatusActions portfolio={portfolio} />
      </QueryClientProvider>,
    ),
  }
}

describe("PortfolioStatusActions", () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it("offers only the legal next state for a draft portfolio", () => {
    renderActions(makeDetail({ status: "draft" }))

    expect(
      screen.getByRole("button", { name: /mark reviewed/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /mark sent/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /mark accepted/i }),
    ).not.toBeInTheDocument()
  })

  it("offers accepted and rejected for a sent portfolio", () => {
    renderActions(makeDetail({ status: "sent" }))

    expect(
      screen.getByRole("button", { name: /mark accepted/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /mark rejected/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /mark reviewed/i }),
    ).not.toBeInTheDocument()
  })

  it("renders nothing for a terminal closed portfolio", () => {
    renderActions(makeDetail({ status: "closed" }))

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("confirms then PATCHes with the right body and invalidates detail + event list", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      updatePortfolioStatus(
        (id, status) =>
          makePortfolioRow({ id, eventId: "e-1", status: status as never }),
        capture,
      ),
    )
    const { queryClient } = renderActions(
      makeDetail({ id: "p-1", eventId: "e-1", status: "draft" }),
    )
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /mark reviewed/i }))

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument()
    expect(capture.body).toBeUndefined()

    await user.click(screen.getByRole("button", { name: /^confirm$/i }))

    await waitFor(() => expect(capture.body).toEqual({ status: "reviewed" }))
    expect(capture.id).toBe("p-1")
    expect(toastSuccess).toHaveBeenCalled()

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ["portfolios", "detail", "p-1"],
      }),
    )
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["portfolios", "event", "e-1"],
    })
  })

  it("surfaces INVALID_PORTFOLIO_TRANSITION on confirm", async () => {
    server.use(
      updatePortfolioStatusError(
        "INVALID_PORTFOLIO_TRANSITION",
        "That portfolio transition is not allowed.",
        409,
        { allowed: ["reviewed"] },
      ),
    )
    renderActions(makeDetail({ id: "p-1", status: "draft" }))
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /mark reviewed/i }))
    await user.click(screen.getByRole("button", { name: /^confirm$/i }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "That portfolio transition is not allowed.",
      ),
    )
  })
})
