import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InvitationsClient } from "@/lib/clients/invitations.client"
import { invitationsQueryKey } from "@/features/invitations/constants/invitation.constants"
import type { DispatchResult } from "@/features/invitations/types/invitation.types"

export function useDispatchInvitations(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation<DispatchResult, Error, void>({
    mutationFn: () => InvitationsClient.dispatch(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...invitationsQueryKey, eventId] })
    },
  })
}
