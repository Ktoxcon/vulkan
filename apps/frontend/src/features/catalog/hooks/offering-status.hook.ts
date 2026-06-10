import { useMutation, useQueryClient } from "@tanstack/react-query"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { catalogQueryKey } from "@/features/catalog/constants/offering.constants"
import type { Offering } from "@/features/catalog/types/offering.types"

export function useDeactivateOffering() {
  const queryClient = useQueryClient()

  return useMutation<Offering, Error, string>({
    mutationFn: (id) => OfferingsClient.deactivate(id),
    onSuccess: (offering) => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKey })
      queryClient.invalidateQueries({ queryKey: [...catalogQueryKey, "detail", offering.id] })
    },
  })
}

export function useReactivateOffering() {
  const queryClient = useQueryClient()

  return useMutation<Offering, Error, string>({
    mutationFn: (id) => OfferingsClient.update(id, { isActive: true }),
    onSuccess: (offering) => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKey })
      queryClient.invalidateQueries({ queryKey: [...catalogQueryKey, "detail", offering.id] })
    },
  })
}
