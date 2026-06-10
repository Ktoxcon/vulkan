import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EventOfferingsClient } from "@/lib/clients/event-offerings.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"

export function useRemoveOffering() {
  const queryClient = useQueryClient()

  return useMutation<null, Error, { eventId: string; eventOfferingId: string }>({
    mutationFn: ({ eventId, eventOfferingId }) =>
      EventOfferingsClient.remove(eventId, eventOfferingId),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", eventId, "offerings"] })
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", eventId, "readiness"] })
    },
  })
}
