import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RosterClient } from "@/lib/clients/roster.client"
import { rosterQueryKey } from "@/features/roster/constants/roster.constants"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type {
  AddRosterClientInput,
  RosterMember,
} from "@/features/roster/types/roster.types"

export function useAddRosterClient(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation<RosterMember, Error, AddRosterClientInput>({
    mutationFn: (input) => RosterClient.addClient(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...rosterQueryKey, eventId] })
      queryClient.invalidateQueries({
        queryKey: [...eventsQueryKey, "detail", eventId, "readiness"],
      })
    },
  })
}
