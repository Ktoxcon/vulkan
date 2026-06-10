import { useMutation } from "@tanstack/react-query"
import { PortfolioPreviewClient } from "@/lib/clients/portfolio-preview.client"
import type { DiscountPreview } from "@/features/portfolios/types/portfolio.types"

export function useDiscountPreview(token: string) {
  return useMutation<DiscountPreview, Error, string[]>({
    mutationFn: (offeringIds) => PortfolioPreviewClient.preview(token, offeringIds),
  })
}
