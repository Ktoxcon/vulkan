import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AuthClient } from "@/lib/clients/auth.client"
import { sessionQueryKey } from "@/features/auth/constants/auth.constants"

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation<null, Error, void>({
    mutationFn: () => AuthClient.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null)
      queryClient.removeQueries({ queryKey: sessionQueryKey })
    },
  })
}
