import { http, HttpResponse } from "msw"
import type { SessionUser } from "@/features/auth/types/auth.types"

import { API_BASE_URL } from "@/lib/constants/api.constants"

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`

export const adminUser: SessionUser = {
  id: "u-admin",
  email: "admin@vulkan.test",
  name: "Vulkan",
  lastName: "Prime",
  userRole: "admin",
}

export const salesUser: SessionUser = {
  id: "u-sales",
  email: "sales@vulkan.test",
  name: "Sales",
  lastName: "Rep",
  userRole: "sales",
}

export const meAuthenticated = (user: SessionUser, calls?: { count: number }) =>
  http.get(apiUrl("/auth/me"), () => {
    if (calls) calls.count += 1
    return HttpResponse.json({ success: true, data: user })
  })

export const meUnauthenticated = (calls?: { count: number }) =>
  http.get(apiUrl("/auth/me"), () => {
    if (calls) calls.count += 1
    return HttpResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Not signed in." },
      { status: 401 },
    )
  })

export const signInSuccess = (user: SessionUser, calls?: { count: number }) =>
  http.post(apiUrl("/auth/session"), () => {
    if (calls) calls.count += 1
    return HttpResponse.json({ success: true, data: user })
  })

export const signInInvalid = (calls?: { count: number }) =>
  http.post(apiUrl("/auth/session"), () => {
    if (calls) calls.count += 1
    return HttpResponse.json(
      {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
      { status: 401 },
    )
  })

export const signOutSuccess = (calls?: { count: number }) =>
  http.delete(apiUrl("/auth/session"), () => {
    if (calls) calls.count += 1
    return HttpResponse.json({ success: true, data: null })
  })
