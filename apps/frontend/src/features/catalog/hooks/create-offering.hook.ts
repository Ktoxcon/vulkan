import { useMutation, useQueryClient } from "@tanstack/react-query"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { catalogQueryKey } from "@/features/catalog/constants/offering.constants"
import type { CreateOfferingInput, Offering } from "@/features/catalog/types/offering.types"

export function useCreateOffering() {
  const queryClient = useQueryClient()

  return useMutation<Offering, Error, CreateOfferingInput>({
    mutationFn: (input) => OfferingsClient.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKey })
    },
  })
}
