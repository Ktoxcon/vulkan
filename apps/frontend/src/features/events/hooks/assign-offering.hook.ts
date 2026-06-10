import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EventOfferingsClient } from "@/lib/clients/event-offerings.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { EventOffering } from "@/features/events/types/event.types"

export function useAssignOffering() {
  const queryClient = useQueryClient()

  return useMutation<EventOffering, Error, { eventId: string; offeringId: string }>({
    mutationFn: ({ eventId, offeringId }) => EventOfferingsClient.assign(eventId, offeringId),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", eventId, "offerings"] })
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", eventId, "readiness"] })
    },
  })
}
