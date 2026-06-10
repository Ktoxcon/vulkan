import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { EVENTS_PAGE_SIZE, eventsQueryKey } from "@/features/events/constants/event.constants"
import type { OfferingListResult } from "@/features/catalog/types/offering.types"

export function useOfferingsCatalog(
  { page: initialPage = 0, type }: { page?: number; type?: string } = {},
) {
  const [page, setPage] = useState(initialPage)

  const query = useQuery<OfferingListResult>({
    queryKey: [...eventsQueryKey, "offerings-catalog", type ?? null, page],
    queryFn: () =>
      OfferingsClient.list({
        isActive: true,
        type,
        limit: EVENTS_PAGE_SIZE,
        offset: page * EVENTS_PAGE_SIZE,
      }),
  })

  const count = query.data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / EVENTS_PAGE_SIZE))
  const hasNextPage = page + 1 < pageCount
  const hasPreviousPage = page > 0

  return {
    items: query.data?.items ?? [],
    count,
    page,
    pageCount,
    pageSize: EVENTS_PAGE_SIZE,
    hasNextPage,
    hasPreviousPage,
    nextPage: () => setPage((current) => (hasNextPage ? current + 1 : current)),
    previousPage: () => setPage((current) => (current > 0 ? current - 1 : current)),
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
