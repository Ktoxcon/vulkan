import { request } from "@/lib/clients/http.client"
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserListResult,
} from "@/features/users/types/user.types"

function toWireBody(input: CreateUserInput | UpdateUserInput) {
  const { role, ...rest } = input
  return role === undefined ? rest : { ...rest, userRole: role }
}

async function list(params: { limit: number; offset: number }): Promise<UserListResult> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  })
  return request<UserListResult>(`/users?${query.toString()}`)
}

async function getById(id: string): Promise<User> {
  return request<User>(`/users/${id}`)
}

async function create(input: CreateUserInput): Promise<User> {
  return request<User>("/users", { method: "POST", body: toWireBody(input) })
}

async function update(id: string, patch: UpdateUserInput): Promise<User> {
  return request<User>(`/users/${id}`, { method: "PATCH", body: toWireBody(patch) })
}

export const UsersClient = { list, getById, create, update }
