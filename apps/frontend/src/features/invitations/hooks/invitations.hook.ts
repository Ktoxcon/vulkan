import { useQuery } from "@tanstack/react-query"
import { InvitationsClient } from "@/lib/clients/invitations.client"
import { invitationsQueryKey } from "@/features/invitations/constants/invitation.constants"
import type {
  InvitationListView,
  InvitationStatus,
} from "@/features/invitations/types/invitation.types"

export function useInvitations(
  eventId: string | undefined,
  params: { status?: InvitationStatus } = {}
) {
  const query = useQuery<InvitationListView>({
    queryKey: [...invitationsQueryKey, eventId, { status: params.status ?? null }],
    queryFn: () => InvitationsClient.list(eventId as string, params),
    enabled: Boolean(eventId),
    refetchInterval: (q) => {
      const monitoring = q.state.data?.monitoring
      if (!monitoring) return false
      return monitoring.queued + monitoring.processing > 0 ? 3000 : false
    },
  })

  return {
    invitations: query.data?.invitations ?? [],
    monitoring: query.data?.monitoring ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
