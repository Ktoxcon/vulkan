export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(params: { code: string; message: string; status: number; details?: unknown }) {
    super(params.message)
    this.name = "ApiError"
    this.code = params.code
    this.status = params.status
    this.details = params.details
  }
}
