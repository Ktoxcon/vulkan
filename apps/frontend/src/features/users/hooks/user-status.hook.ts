import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UsersClient } from "@/lib/clients/users.client"
import { usersQueryKey } from "@/features/users/constants/user.constants"
import type { User, UserStatus } from "@/features/users/types/user.types"

export function useSetUserStatus() {
  const queryClient = useQueryClient()

  return useMutation<User, Error, { id: string; status: UserStatus }>({
    mutationFn: ({ id, status }) => UsersClient.update(id, { status }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
      queryClient.invalidateQueries({ queryKey: [...usersQueryKey, "detail", user.id] })
    },
  })
}
