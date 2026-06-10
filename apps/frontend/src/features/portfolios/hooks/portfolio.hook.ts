import { useQuery } from "@tanstack/react-query"
import { PortfoliosClient } from "@/lib/clients/portfolios.client"
import { portfoliosQueryKey } from "@/features/portfolios/constants/portfolio.constants"
import type { PortfolioDetail } from "@/features/portfolios/types/portfolio.types"
import { ApiError } from "@/lib/errors/api.error"

export function usePortfolio(portfolioId: string | undefined) {
  const query = useQuery<PortfolioDetail>({
    queryKey: [...portfoliosQueryKey, "detail", portfolioId],
    queryFn: () => PortfoliosClient.getById(portfolioId as string),
    enabled: Boolean(portfolioId),
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 403)
      ) {
        return false
      }
      return failureCount < 3
    },
  })

  return {
    portfolio: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
