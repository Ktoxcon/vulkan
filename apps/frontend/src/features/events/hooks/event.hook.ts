import { useQuery } from "@tanstack/react-query"
import { EventsClient } from "@/lib/clients/events.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { SalesEvent } from "@/features/events/types/event.types"

export function useEvent(id: string | undefined) {
  const query = useQuery<SalesEvent>({
    queryKey: [...eventsQueryKey, "detail", id],
    queryFn: () => EventsClient.getById(id as string),
    enabled: Boolean(id),
  })

  return {
    event: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
