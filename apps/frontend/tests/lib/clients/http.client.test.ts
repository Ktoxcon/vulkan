import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { request, HttpClient } from "@/lib/clients/http.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import { apiUrl } from "../../msw/handlers"

describe("http.client request", () => {
  it("unwraps { success, data } and returns data", async () => {
    server.use(
      http.get(apiUrl("/ping"), () =>
        HttpResponse.json({ success: true, data: { value: 42 } }),
      ),
    )

    const result = await request<{ value: number }>("/ping")

    expect(result).toEqual({ value: 42 })
  })

  it("throws ApiError with code and message on { success:false }", async () => {
    server.use(
      http.get(apiUrl("/boom"), () =>
        HttpResponse.json(
          {
            success: false,
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
          { status: 401 },
        ),
      ),
    )

    const error = await request("/boom").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("INVALID_CREDENTIALS")
    expect(error.message).toBe("Invalid email or password.")
    expect(error.status).toBe(401)
  })

  it("propagates error details when present", async () => {
    server.use(
      http.get(apiUrl("/bad"), () =>
        HttpResponse.json(
          {
            success: false,
            code: "VALIDATION_ERROR",
            message: "Bad input.",
            details: { fieldErrors: { email: ["Required"] } },
          },
          { status: 400 },
        ),
      ),
    )

    const error = await request("/bad").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.details).toEqual({ fieldErrors: { email: ["Required"] } })
  })

  it("throws INVALID_RESPONSE ApiError on an unreadable body", async () => {
    server.use(
      http.get(apiUrl("/garbage"), () =>
        HttpResponse.text("not json", { status: 500 }),
      ),
    )

    const error = await request("/garbage").catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("INVALID_RESPONSE")
    expect(error.status).toBe(500)
  })

  it("sends a JSON body for write methods", async () => {
    let contentType: string | null = null
    let parsed: Record<string, unknown> = {}
    server.use(
      http.post(apiUrl("/echo"), async ({ request: req }) => {
        contentType = req.headers.get("content-type")
        parsed = (await req.json()) as Record<string, unknown>
        return HttpResponse.json({ success: true, data: null })
      }),
    )

    await request("/echo", {
      method: "POST",
      body: { email: "a@b.co", password: "pw" },
    })

    expect(contentType).toBe("application/json")
    expect(parsed.email).toBe("a@b.co")
    expect(parsed.password).toBe("pw")
  })

  it("exposes request through the HttpClient object", () => {
    expect(HttpClient.request).toBe(request)
  })
})
