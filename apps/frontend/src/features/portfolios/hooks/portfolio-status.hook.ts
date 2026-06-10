import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PortfoliosClient } from "@/lib/clients/portfolios.client"
import { portfoliosQueryKey } from "@/features/portfolios/constants/portfolio.constants"
import type {
  Portfolio,
  PortfolioStatus,
} from "@/features/portfolios/types/portfolio.types"

export function useUpdatePortfolioStatus(portfolioId: string) {
  const queryClient = useQueryClient()

  return useMutation<Portfolio, Error, PortfolioStatus>({
    mutationFn: (status) => PortfoliosClient.updateStatus(portfolioId, status),
    onSuccess: (portfolio) => {
      queryClient.invalidateQueries({
        queryKey: [...portfoliosQueryKey, "detail", portfolioId],
      })
      queryClient.invalidateQueries({
        queryKey: [...portfoliosQueryKey, "event", portfolio.eventId],
      })
    },
  })
}
