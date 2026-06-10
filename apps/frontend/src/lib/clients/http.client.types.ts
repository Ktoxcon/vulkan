export type ApiErrorBody = {
  success: false
  code: string
  message: string
  details?: unknown
}

export type ApiSuccessBody<T> = {
  success: true
  data: T
}

export type ApiEnvelope<T> = ApiSuccessBody<T> | ApiErrorBody

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown | FormData
  signal?: AbortSignal
}
