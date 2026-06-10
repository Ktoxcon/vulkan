import { useQuery } from "@tanstack/react-query"
import { AuthClient } from "@/lib/clients/auth.client"
import { sessionQueryKey } from "@/features/auth/constants/auth.constants"
import type { SessionUser } from "@/features/auth/types/auth.types"

export function useSession() {
  const query = useQuery<SessionUser>({
    queryKey: sessionQueryKey,
    queryFn: () => AuthClient.getMe(),
    retry: false,
  })

  return {
    user: query.data ?? null,
    status: query.status,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
