import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EventsClient } from "@/lib/clients/events.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { SalesEvent, UpdateEventInput } from "@/features/events/types/event.types"

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation<SalesEvent, Error, { id: string; fields: UpdateEventInput }>({
    mutationFn: ({ id, fields }) => EventsClient.update(id, fields),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKey })
      queryClient.invalidateQueries({ queryKey: [...eventsQueryKey, "detail", event.id] })
    },
  })
}
