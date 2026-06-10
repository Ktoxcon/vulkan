import { useQuery } from "@tanstack/react-query"
import { InvitationsClient } from "@/lib/clients/invitations.client"
import { dispatchQueryKey } from "@/features/invitations/constants/invitation.constants"
import type { DispatchProgress } from "@/features/invitations/types/invitation.types"

export function useDispatchProgress(eventId: string, dispatchId: string | null | undefined) {
  const query = useQuery<DispatchProgress>({
    queryKey: [...dispatchQueryKey, eventId, dispatchId],
    queryFn: () => InvitationsClient.getDispatch(eventId, dispatchId as string),
    enabled: Boolean(eventId) && Boolean(dispatchId),
    refetchInterval: (q) => {
      const progress = q.state.data
      if (!progress) return false
      return progress.pending + progress.queued + progress.processing > 0 ? 3000 : false
    },
  })

  return {
    progress: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
