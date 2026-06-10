export type UserRole = "admin" | "sales"

export type SessionUser = {
  id: string
  email: string
  name: string
  lastName: string
  userRole: UserRole
}

export type SignInInput = {
  email: string
  password: string
}
