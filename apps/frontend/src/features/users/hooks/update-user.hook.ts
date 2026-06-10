import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UsersClient } from "@/lib/clients/users.client"
import { usersQueryKey } from "@/features/users/constants/user.constants"
import type { UpdateUserInput, User } from "@/features/users/types/user.types"

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<User, Error, { id: string; patch: UpdateUserInput }>({
    mutationFn: ({ id, patch }) => UsersClient.update(id, patch),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
      queryClient.invalidateQueries({ queryKey: [...usersQueryKey, "detail", user.id] })
    },
  })
}
