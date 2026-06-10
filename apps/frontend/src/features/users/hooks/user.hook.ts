import { useQuery } from "@tanstack/react-query"
import { UsersClient } from "@/lib/clients/users.client"
import { usersQueryKey } from "@/features/users/constants/user.constants"
import type { User } from "@/features/users/types/user.types"

export function useUser(id: string | undefined) {
  const query = useQuery<User>({
    queryKey: [...usersQueryKey, "detail", id],
    queryFn: () => UsersClient.getById(id as string),
    enabled: Boolean(id),
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
