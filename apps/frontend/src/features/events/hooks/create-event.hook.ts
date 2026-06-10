import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EventsClient } from "@/lib/clients/events.client"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { CreateEventInput, SalesEvent } from "@/features/events/types/event.types"

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation<SalesEvent, Error, CreateEventInput>({
    mutationFn: (input) => EventsClient.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKey })
    },
  })
}
