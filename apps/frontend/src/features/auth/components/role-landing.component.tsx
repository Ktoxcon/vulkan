import { Navigate } from "react-router"
import { useAuth } from "@/features/auth/hooks/auth.hook"
import { landingByRole, Routes } from "@/lib/constants/routes.constants"

export function RoleLanding() {
  const { role } = useAuth()

  return <Navigate to={role ? landingByRole[role] : Routes.login} replace />
}
