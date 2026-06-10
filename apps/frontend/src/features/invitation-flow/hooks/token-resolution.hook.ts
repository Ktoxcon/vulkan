import { useQuery } from "@tanstack/react-query"
import { InvitationFlowClient } from "@/lib/clients/invitation-flow.client"
import { invitationFlowQueryKey } from "@/features/invitation-flow/constants/invitation-flow.constants"
import type { TokenResolution } from "@/features/invitation-flow/types/invitation-flow.types"
import { ApiError } from "@/lib/errors/api.error"

export function useTokenResolution(token: string | undefined) {
  const query = useQuery<TokenResolution>({
    queryKey: [...invitationFlowQueryKey, "resolution", token],
    queryFn: () => InvitationFlowClient.resolve(token as string),
    enabled: Boolean(token),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
      return failureCount < 3
    },
  })

  return {
    resolution: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
