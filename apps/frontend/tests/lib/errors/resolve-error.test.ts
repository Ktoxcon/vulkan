import { describe, expect, it } from "vitest"
import { resolveError } from "@/lib/errors/resolve-error"
import { ApiError } from "@/lib/errors/api.error"

describe("resolveError", () => {
  it("returns the message of an ApiError", () => {
    const error = new ApiError({
      code: "SOMETHING_FAILED",
      message: "Specific API failure",
      status: 422,
    })

    expect(resolveError(error)).toBe("Specific API failure")
  })

  it("returns the message of a generic Error", () => {
    expect(resolveError(new Error("Boom"))).toBe("Boom")
  })

  it("returns the generic fallback for unknown values", () => {
    expect(resolveError("nope")).toBe("Something went wrong. Please try again.")
    expect(resolveError(null)).toBe("Something went wrong. Please try again.")
    expect(resolveError(undefined)).toBe(
      "Something went wrong. Please try again.",
    )
    expect(resolveError({ message: "not an error" })).toBe(
      "Something went wrong. Please try again.",
    )
  })
})
