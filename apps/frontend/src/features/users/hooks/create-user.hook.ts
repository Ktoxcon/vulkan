import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UsersClient } from "@/lib/clients/users.client"
import { usersQueryKey } from "@/features/users/constants/user.constants"
import type { CreateUserInput, User } from "@/features/users/types/user.types"

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<User, Error, CreateUserInput>({
    mutationFn: (input) => UsersClient.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}
