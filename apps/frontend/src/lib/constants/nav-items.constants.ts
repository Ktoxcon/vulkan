import { CalendarDays, Package, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Routes } from "@/lib/constants/routes.constants"
import type { UserRole } from "@/features/auth/types/auth.types"

export const navItems: {
  to: string
  label: string
  icon: LucideIcon
  requiredRole?: UserRole
}[] = [
  { to: Routes.events, label: "common:nav.events", icon: CalendarDays },
  { to: Routes.catalog, label: "common:nav.catalog", icon: Package, requiredRole: "admin" },
  { to: Routes.users, label: "common:nav.users", icon: Users, requiredRole: "admin" },
]
