import { useQuery } from "@tanstack/react-query"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { catalogQueryKey } from "@/features/catalog/constants/offering.constants"
import type { Offering } from "@/features/catalog/types/offering.types"

export function useOffering(id: string | undefined) {
  const query = useQuery<Offering>({
    queryKey: [...catalogQueryKey, "detail", id],
    queryFn: () => OfferingsClient.getById(id as string),
    enabled: Boolean(id),
  })

  return {
    offering: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
