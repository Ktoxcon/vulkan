import type { UserRole, UserStatus } from "@/features/users/types/user.types"

export const usersQueryKey = ["users"] as const

export const USERS_PAGE_SIZE = 10

export const roleOptions: { label: string; value: UserRole }[] = [
  { label: "users:roles.admin", value: "admin" },
  { label: "users:roles.sales", value: "sales" },
]

export const statusOptions: { label: string; value: UserStatus }[] = [
  { label: "users:statuses.ACTIVE", value: "ACTIVE" },
  { label: "users:statuses.PENDING", value: "PENDING" },
  { label: "users:statuses.INACTIVE", value: "INACTIVE" },
]

export const userStatusBadge: Record<
  UserStatus,
  { variant: "default" | "secondary" | "outline"; label: string }
> = {
  ACTIVE: { variant: "default", label: "users:statuses.ACTIVE" },
  PENDING: { variant: "secondary", label: "users:statuses.PENDING" },
  INACTIVE: { variant: "outline", label: "users:statuses.INACTIVE" },
}
