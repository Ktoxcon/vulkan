import { http, HttpResponse } from "msw"
import type { User } from "@/features/users/types/user.types"
import { apiUrl } from "./handlers"

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-1",
    name: "Vulcan",
    lastName: "Smith",
    email: "vulcan@vulkan.test",
    role: "sales",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeUsers(total: number): User[] {
  return Array.from({ length: total }, (_, index) =>
    makeUser({
      id: `u-${index + 1}`,
      name: `User${index + 1}`,
      lastName: "Test",
      email: `user${index + 1}@vulkan.test`,
    }),
  )
}

export const listUsersPaged = (all: User[], capture?: { limit?: number; offset?: number }) =>
  http.get(apiUrl("/users"), ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") ?? "10")
    const offset = Number(url.searchParams.get("offset") ?? "0")
    if (capture) {
      capture.limit = limit
      capture.offset = offset
    }
    const items = all.slice(offset, offset + limit)
    return HttpResponse.json({ success: true, data: { count: all.length, items } })
  })

export const listUsersError = () =>
  http.get(apiUrl("/users"), () =>
    HttpResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Boom." },
      { status: 500 },
    ),
  )

export const getUser = (user: User) =>
  http.get(apiUrl(`/users/${user.id}`), () =>
    HttpResponse.json({ success: true, data: user }),
  )

export const getUserNotFound = (id: string) =>
  http.get(apiUrl(`/users/${id}`), () =>
    HttpResponse.json(
      { success: false, code: "USER_NOT_FOUND", message: "User not found." },
      { status: 404 },
    ),
  )

export const createUserSuccess = (
  capture?: { body?: Record<string, unknown> },
  user: User = makeUser({ id: "u-new" }),
) =>
  http.post(apiUrl("/users"), async ({ request }) => {
    if (capture) {
      capture.body = (await request.json()) as Record<string, unknown>
    }
    return HttpResponse.json({ success: true, data: user }, { status: 201 })
  })

export const createUserConflict = () =>
  http.post(apiUrl("/users"), () =>
    HttpResponse.json(
      {
        success: false,
        code: "USER_ALREADY_EXISTS",
        message: "A user with this email already exists.",
      },
      { status: 409 },
    ),
  )

export const updateUserSuccess = (
  result: User,
  capture?: { body?: Record<string, unknown>; id?: string },
) =>
  http.patch(apiUrl(`/users/${result.id}`), async ({ request }) => {
    if (capture) {
      capture.body = (await request.json()) as Record<string, unknown>
      capture.id = result.id
    }
    return HttpResponse.json({ success: true, data: result })
  })

export const patchAnyUser = (
  resolve: (id: string, body: Record<string, unknown>) => User,
  capture?: { body?: Record<string, unknown>; id?: string },
) =>
  http.patch(apiUrl("/users/:id"), async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const id = params.id as string
    if (capture) {
      capture.body = body
      capture.id = id
    }
    return HttpResponse.json({ success: true, data: resolve(id, body) })
  })
