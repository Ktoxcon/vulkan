import { useQuery } from "@tanstack/react-query"
import { EventOfferingsClient } from "@/lib/clients/event-offerings.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { AssignedOffering } from "@/features/events/types/event.types"

export function useEventOfferings(id: string | undefined) {
  const query = useQuery<AssignedOffering[]>({
    queryKey: [...eventsQueryKey, "detail", id, "offerings"],
    queryFn: () => EventOfferingsClient.listForEvent(id as string),
    enabled: Boolean(id),
  })

  return {
    offerings: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
