import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EventsClient } from "@/lib/clients/events.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { EventStatus, SalesEvent } from "@/features/events/types/event.types"

export function useEventTransition() {
  const queryClient = useQueryClient()

  return useMutation<SalesEvent, Error, { id: string; status: EventStatus }>({
    mutationFn: ({ id, status }) => EventsClient.transition(id, status),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKey })
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", event.id] })
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", event.id, "readiness"] })
    },
  })
}
