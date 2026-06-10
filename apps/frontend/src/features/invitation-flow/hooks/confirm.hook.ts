import { useMutation } from "@tanstack/react-query"
import { InvitationFlowClient } from "@/lib/clients/invitation-flow.client"
import type {
  ConfirmationResult,
  ConfirmInput,
} from "@/features/invitation-flow/types/invitation-flow.types"

export function useConfirm(token: string) {
  return useMutation<ConfirmationResult, Error, ConfirmInput>({
    mutationFn: (input) => InvitationFlowClient.confirm(token, input),
  })
}
