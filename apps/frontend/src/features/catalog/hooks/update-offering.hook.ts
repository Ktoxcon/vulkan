import { useMutation, useQueryClient } from "@tanstack/react-query"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { catalogQueryKey } from "@/features/catalog/constants/offering.constants"
import type { Offering, UpdateOfferingInput } from "@/features/catalog/types/offering.types"

export function useUpdateOffering(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Offering, Error, UpdateOfferingInput>({
    mutationFn: (patch) => OfferingsClient.update(id, patch),
    onSuccess: (offering) => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKey })
      queryClient.invalidateQueries({ queryKey: [...catalogQueryKey, "detail", offering.id] })
    },
  })
}
