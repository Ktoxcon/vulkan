import { useMutation, useQueryClient } from "@tanstack/react-query"
import { OfferingImportsClient } from "@/lib/clients/offering-imports.client"
import { catalogQueryKey } from "@/features/catalog/constants/offering.constants"
import type { OfferingImportRecord } from "@/features/catalog/types/offering.types"

export function useCreateOfferingImport() {
  return useMutation<OfferingImportRecord, Error, File>({
    mutationFn: (file) => OfferingImportsClient.createImport(file),
  })
}

export function useConfirmOfferingImport() {
  const queryClient = useQueryClient()

  return useMutation<OfferingImportRecord, Error, string>({
    mutationFn: (importId) => OfferingImportsClient.confirmImport(importId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKey })
    },
  })
}
