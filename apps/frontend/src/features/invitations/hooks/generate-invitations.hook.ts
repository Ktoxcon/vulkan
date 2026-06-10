import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InvitationsClient } from "@/lib/clients/invitations.client"
import { invitationsQueryKey } from "@/features/invitations/constants/invitation.constants"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type { GenerateResult } from "@/features/invitations/types/invitation.types"

export function useGenerateInvitations(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation<GenerateResult, Error, void>({
    mutationFn: () => InvitationsClient.generate(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...invitationsQueryKey, eventId] })
      queryClient.invalidateQueries({
        queryKey: [...eventsQueryKey, "detail", eventId, "readiness"],
      })
    },
  })
}
