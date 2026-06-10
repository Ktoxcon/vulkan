import { afterEach, describe, expect, it, vi } from "vitest"
import { PortfoliosClient } from "@/lib/clients/portfolios.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  exportPortfolio,
  getPortfolio,
  getPortfolioError,
  listPortfolios,
  listPortfoliosError,
  makeDetail,
  makeListRows,
  makePortfolioRow,
  updatePortfolioStatus,
  updatePortfolioStatusError,
} from "../../msw/portfolios.handlers"

describe("PortfoliosClient", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("lists portfolios for an event as a bare array", async () => {
    server.use(listPortfolios(makeListRows(3)))

    const rows = await PortfoliosClient.listByEvent("e-1")

    expect(Array.isArray(rows)).toBe(true)
    expect(rows).toHaveLength(3)
    expect(rows[0].clientName).toBe("Client 1")
    expect(rows[0].totalAfterDiscount).toBe("1000.00")
  })

  it("returns an empty array when no portfolios exist", async () => {
    server.use(listPortfolios([]))

    const rows = await PortfoliosClient.listByEvent("e-1")

    expect(rows).toEqual([])
  })

  it("surfaces a list error as an ApiError", async () => {
    server.use(listPortfoliosError("INTERNAL_ERROR", "Boom.", 500))

    const error = await PortfoliosClient.listByEvent("e-1").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
  })

  it("fetches a portfolio detail with client, event, attendanceDate and items", async () => {
    server.use(getPortfolio(makeDetail({ id: "p-1" })))

    const detail = await PortfoliosClient.getById("p-1")

    expect(detail.client.name).toBe("Vulkan Hestan")
    expect(detail.event.id).toBe("e-1")
    expect(detail.attendanceDate).toBe("2026-09-01T09:00:00.000Z")
    expect(detail.items).toHaveLength(2)
    expect(detail.items[0].offeringType).toBe("product")
    expect(detail.serviceDiscountPercentage).toBe(10)
  })

  it("surfaces PORTFOLIO_NOT_FOUND (404)", async () => {
    server.use(getPortfolioError("missing", "PORTFOLIO_NOT_FOUND", "Not found.", 404))

    const error = await PortfoliosClient.getById("missing").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("PORTFOLIO_NOT_FOUND")
    expect(error.status).toBe(404)
  })

  it("surfaces PORTFOLIO_ACCESS_DENIED (403)", async () => {
    server.use(
      getPortfolioError("p-other", "PORTFOLIO_ACCESS_DENIED", "Denied.", 403),
    )

    const error = await PortfoliosClient.getById("p-other").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("PORTFOLIO_ACCESS_DENIED")
    expect(error.status).toBe(403)
  })

  it("PATCHes the status with the right body and returns the updated row", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(
      updatePortfolioStatus(
        (id, status) => makePortfolioRow({ id, status: status as never }),
        capture,
      ),
    )

    const updated = await PortfoliosClient.updateStatus("p-1", "reviewed")

    expect(capture.id).toBe("p-1")
    expect(capture.body).toEqual({ status: "reviewed" })
    expect(updated.status).toBe("reviewed")
    expect(updated).not.toHaveProperty("items")
    expect(updated).not.toHaveProperty("client")
  })

  it("surfaces INVALID_PORTFOLIO_TRANSITION (409) with allowed details", async () => {
    server.use(
      updatePortfolioStatusError(
        "INVALID_PORTFOLIO_TRANSITION",
        "Not allowed.",
        409,
        { allowed: ["reviewed"] },
      ),
    )

    const error = await PortfoliosClient.updateStatus("p-1", "closed").catch(
      (e) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("INVALID_PORTFOLIO_TRANSITION")
    expect(error.status).toBe(409)
    expect(error.details).toEqual({ allowed: ["reviewed"] })
  })

  it("exports CSV through the file-download path", async () => {
    const capture: { requested?: boolean } = {}
    server.use(exportPortfolio("p-1", "a,b\n1,2\n", capture))
    const createUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:csv")
    const revokeUrl = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})

    await PortfoliosClient.exportCsv("p-1")

    expect(capture.requested).toBe(true)
    expect(createUrl).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeUrl).toHaveBeenCalledWith("blob:csv")
  })
})
