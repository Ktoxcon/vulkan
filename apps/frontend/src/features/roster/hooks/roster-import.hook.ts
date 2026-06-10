import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RosterClient } from "@/lib/clients/roster.client"
import { rosterQueryKey } from "@/features/roster/constants/roster.constants"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { ImportRecord, Roster } from "@/features/roster/types/roster.types"

export function useCreateRosterImport(eventId: string) {
  return useMutation<ImportRecord, Error, File>({
    mutationFn: (file) => RosterClient.createImport(eventId, file),
  })
}

export function useConfirmRosterImport(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation<Roster, Error, string>({
    mutationFn: (importId) => RosterClient.confirmImport(eventId, importId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...rosterQueryKey, eventId] })
      queryClient.invalidateQueries({
        queryKey: [...eventsQueryKey, "detail", eventId, "readiness"],
      })
    },
  })
}
