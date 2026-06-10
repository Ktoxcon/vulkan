import { http, HttpResponse } from "msw"
import type {
  Portfolio,
  PortfolioDetail,
  PortfolioItem,
  PortfolioListRow,
} from "@/features/portfolios/types/portfolio.types"
import { apiUrl } from "./handlers"

export function makeListRow(
  overrides: Partial<PortfolioListRow> = {},
): PortfolioListRow {
  return {
    id: "p-1",
    status: "draft",
    clientName: "Vulkan Hestan",
    clientEmail: "vulkan@nocturne.test",
    eventName: "Annual Forge Expo",
    attendanceDate: "2026-09-01T09:00:00.000Z",
    totalBeforeDiscount: "1200.00",
    totalDiscountAmount: "200.00",
    totalAfterDiscount: "1000.00",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeListRows(total: number): PortfolioListRow[] {
  return Array.from({ length: total }, (_, index) =>
    makeListRow({
      id: `p-${index + 1}`,
      clientName: `Client ${index + 1}`,
      clientEmail: `client${index + 1}@nocturne.test`,
    }),
  )
}

export function makeItem(overrides: Partial<PortfolioItem> = {}): PortfolioItem {
  return {
    id: "pi-1",
    portfolioId: "p-1",
    offeringId: "o-1",
    offeringName: "Drakescale Plate",
    offeringType: "product",
    basePrice: "500.00",
    discountPercentage: 10,
    discountAmount: "50.00",
    finalPrice: "450.00",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makePortfolioRow(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: "p-1",
    eventId: "e-1",
    clientId: "c-1",
    attendanceConfirmationId: "ac-1",
    ownerId: "u-sales",
    status: "draft",
    serviceSubtotal: "700.00",
    serviceDiscountPercentage: 10,
    serviceDiscountAmount: "70.00",
    serviceTotalAfterDiscount: "630.00",
    productSubtotal: "500.00",
    productDiscountPercentage: 26,
    productDiscountAmount: "130.00",
    productTotalAfterDiscount: "370.00",
    totalBeforeDiscount: "1200.00",
    totalDiscountAmount: "200.00",
    totalAfterDiscount: "1000.00",
    reviewedAt: null,
    reviewedBy: null,
    sentAt: null,
    acceptedAt: null,
    rejectedAt: null,
    closedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeDetail(
  overrides: Partial<PortfolioDetail> = {},
): PortfolioDetail {
  const { items, client, event, attendanceDate, ...rowOverrides } = overrides
  return {
    ...makePortfolioRow(rowOverrides),
    client: client ?? { name: "Vulkan Hestan", email: "vulkan@nocturne.test" },
    event: event ?? { id: "e-1", name: "Annual Forge Expo" },
    attendanceDate: attendanceDate ?? "2026-09-01T09:00:00.000Z",
    items: items ?? [
      makeItem({
        id: "pi-1",
        offeringName: "Drakescale Plate",
        offeringType: "product",
      }),
      makeItem({
        id: "pi-2",
        offeringId: "o-2",
        offeringName: "Forge Consultation",
        offeringType: "service",
        basePrice: "700.00",
        discountPercentage: 10,
        discountAmount: "70.00",
        finalPrice: "630.00",
      }),
    ],
  }
}

export const listPortfolios = (rows: PortfolioListRow[], eventId = "e-1") =>
  http.get(apiUrl(`/events/${eventId}/portfolios`), () =>
    HttpResponse.json({ success: true, data: rows }),
  )

export const listPortfoliosError = (
  code = "INTERNAL_ERROR",
  message = "Boom.",
  status = 500,
  eventId = "e-1",
) =>
  http.get(apiUrl(`/events/${eventId}/portfolios`), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const getPortfolio = (detail: PortfolioDetail) =>
  http.get(apiUrl(`/portfolios/${detail.id}`), () =>
    HttpResponse.json({ success: true, data: detail }),
  )

export const getPortfolioError = (
  id: string,
  code: string,
  message: string,
  status: number,
) =>
  http.get(apiUrl(`/portfolios/${id}`), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const updatePortfolioStatus = (
  resolve: (id: string, status: string) => Portfolio,
  capture?: { body?: Record<string, unknown>; id?: string; calls?: number },
) =>
  http.patch(
    apiUrl("/portfolios/:portfolioId/status"),
    async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>
      const id = params.portfolioId as string
      if (capture) {
        capture.body = body
        capture.id = id
        capture.calls = (capture.calls ?? 0) + 1
      }
      return HttpResponse.json({
        success: true,
        data: resolve(id, body.status as string),
      })
    },
  )

export const updatePortfolioStatusError = (
  code = "INVALID_PORTFOLIO_TRANSITION",
  message = "That portfolio transition is not allowed.",
  status = 409,
  details?: unknown,
) =>
  http.patch(apiUrl("/portfolios/:portfolioId/status"), () =>
    HttpResponse.json({ success: false, code, message, details }, { status }),
  )

export const exportPortfolio = (
  id: string,
  csv = "offering,type,base,discount,final\nDrakescale Plate,product,500.00,50.00,450.00\n",
  capture?: { requested?: boolean },
) =>
  http.get(apiUrl(`/portfolios/${id}/export`), () => {
    if (capture) capture.requested = true
    return new HttpResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="portfolio-${id}.csv"`,
      },
    })
  })
