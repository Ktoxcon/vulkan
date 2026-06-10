import { useQuery } from "@tanstack/react-query"
import { InvitationFlowClient } from "@/lib/clients/invitation-flow.client"
import { invitationFlowQueryKey } from "@/features/invitation-flow/constants/invitation-flow.constants"
import type { GroupedOfferings } from "@/features/invitation-flow/types/invitation-flow.types"

export function useInvitationOfferings(token: string | undefined, eligible: boolean) {
  const query = useQuery<GroupedOfferings>({
    queryKey: [...invitationFlowQueryKey, "offerings", token],
    queryFn: () => InvitationFlowClient.getOfferings(token as string),
    enabled: Boolean(token) && eligible,
  })

  return {
    products: query.data?.products ?? [],
    services: query.data?.services ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
