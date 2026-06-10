import { request } from "@/lib/clients/http.client"
import type { SessionUser, SignInInput } from "@/features/auth/types/auth.types"

async function signIn(input: SignInInput): Promise<SessionUser> {
  return request<SessionUser>("/auth/session", { method: "POST", body: input })
}

async function signOut(): Promise<null> {
  return request<null>("/auth/session", { method: "DELETE" })
}

async function getMe(): Promise<SessionUser> {
  return request<SessionUser>("/auth/me")
}

export const AuthClient = { signIn, signOut, getMe }
