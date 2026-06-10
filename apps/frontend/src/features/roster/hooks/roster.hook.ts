import { useQuery } from "@tanstack/react-query"
import { RosterClient } from "@/lib/clients/roster.client"
import { rosterQueryKey } from "@/features/roster/constants/roster.constants"
import type { RosterView } from "@/features/roster/types/roster.types"
import { ApiError } from "@/lib/errors/api.error"

export function useRoster(eventId: string | undefined) {
  const query = useQuery<RosterView | null>({
    queryKey: [...rosterQueryKey, eventId],
    queryFn: async () => {
      try {
        return await RosterClient.getRoster(eventId as string)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    enabled: Boolean(eventId),
    retry: false,
  })

  return {
    roster: query.data?.roster ?? null,
    clients: query.data?.clients ?? [],
    hasRoster: query.data !== null && query.data !== undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
