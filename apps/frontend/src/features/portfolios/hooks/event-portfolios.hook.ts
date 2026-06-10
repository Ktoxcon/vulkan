import { useQuery } from "@tanstack/react-query"
import { PortfoliosClient } from "@/lib/clients/portfolios.client"
import { portfoliosQueryKey } from "@/features/portfolios/constants/portfolio.constants"
import type { PortfolioListRow } from "@/features/portfolios/types/portfolio.types"

export function useEventPortfolios(eventId: string | undefined) {
  const query = useQuery<PortfolioListRow[]>({
    queryKey: [...portfoliosQueryKey, "event", eventId],
    queryFn: () => PortfoliosClient.listByEvent(eventId as string),
    enabled: Boolean(eventId),
  })

  return {
    portfolios: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
