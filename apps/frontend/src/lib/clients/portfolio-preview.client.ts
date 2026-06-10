import { request } from "@/lib/clients/http.client"
import type { DiscountPreview } from "@/features/portfolios/types/portfolio.types"

async function preview(
  token: string,
  offeringIds: string[]
): Promise<DiscountPreview> {
  return request<DiscountPreview>(`/invitations/${token}/discount-preview`, {
    method: "POST",
    body: { offeringIds },
  })
}

export const PortfolioPreviewClient = { preview }
