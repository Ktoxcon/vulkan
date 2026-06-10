import { useSession } from "@/features/auth/hooks/session.hook"
import type { UserRole } from "@/features/auth/types/auth.types"

export function useAuth() {
  const { user, isLoading } = useSession()
  const role: UserRole | null = user?.userRole ?? null

  return {
    user,
    role,
    isAuthenticated: user !== null,
    isLoading,
  }
}
