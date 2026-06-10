import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AuthClient } from "@/lib/clients/auth.client"
import { sessionQueryKey } from "@/features/auth/constants/auth.constants"
import type { SessionUser, SignInInput } from "@/features/auth/types/auth.types"

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation<SessionUser, Error, SignInInput>({
    mutationFn: (input) => AuthClient.signIn(input),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user)
      queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    },
  })
}
