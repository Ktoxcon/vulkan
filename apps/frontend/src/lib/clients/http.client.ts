import type { ApiEnvelope, RequestOptions } from "@/lib/clients/http.client.types"
import { ApiError } from "@/lib/errors/api.error"
import { API_BASE_URL } from "@/lib/constants/api.constants"

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options

  const init: RequestInit = {
    method,
    credentials: "include",
    signal,
  }

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body
    } else {
      init.headers = { "Content-Type": "application/json" }
      init.body = JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init)

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError({
      code: "INVALID_RESPONSE",
      message: "The server returned an unreadable response.",
      status: response.status,
    })
  }

  if (envelope.success) return envelope.data

  throw new ApiError({
    code: envelope.code,
    message: envelope.message,
    status: response.status,
    details: envelope.details,
  })
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" })

  if (!response.ok) {
    throw new ApiError({
      code: "DOWNLOAD_FAILED",
      message: "The file could not be downloaded.",
      status: response.status,
    })
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export const HttpClient = { request, downloadFile }
