import { useQuery } from "@tanstack/react-query"
import { EventsClient } from "@/lib/clients/events.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { ReadinessReport } from "@/features/events/types/event.types"

export function useEventReadiness(id: string | undefined) {
  const query = useQuery<ReadinessReport>({
    queryKey: [...eventsQueryKey, "detail", id, "readiness"],
    queryFn: () => EventsClient.getReadiness(id as string),
    enabled: Boolean(id),
  })

  return {
    readiness: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
