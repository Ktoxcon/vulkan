import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { EventsClient } from "@/lib/clients/events.client"
import { EVENTS_PAGE_SIZE, eventsQueryKey } from "@/features/events/constants/event.constants"
import type { EventListResult } from "@/features/events/types/event.types"

export function useEvents({ page: initialPage = 0 }: { page?: number } = {}) {
  const [page, setPage] = useState(initialPage)

  const query = useQuery<EventListResult>({
    queryKey: [...eventsQueryKey, "list", page],
    queryFn: () =>
      EventsClient.list({ limit: EVENTS_PAGE_SIZE, offset: page * EVENTS_PAGE_SIZE }),
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
