export type UserRole = "admin" | "sales"

export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE"

export type User = {
  id: string
  name: string
  lastName: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  email: string
  name: string
  lastName: string
  password: string
  role: UserRole
  status: UserStatus
}

export type UpdateUserInput = {
  name?: string
  lastName?: string
  email?: string
  role?: UserRole
  status?: UserStatus
  password?: string
}

export type UserListResult = {
  count: number
  items: User[]
}
