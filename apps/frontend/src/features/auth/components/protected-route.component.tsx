import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/hooks/auth.hook"
import type { UserRole } from "@/features/auth/types/auth.types"
import { landingByRole, Routes } from "@/lib/constants/routes.constants"

type ProtectedRouteProps = {
  children: ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={Routes.login} replace state={{ from: location.pathname }} />
    )
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role ? landingByRole[role] : Routes.forbidden} replace />
  }

  return <>{children}</>
}
