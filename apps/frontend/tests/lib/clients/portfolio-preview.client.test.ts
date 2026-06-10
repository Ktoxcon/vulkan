import { describe, expect, it } from "vitest"
import { PortfolioPreviewClient } from "@/lib/clients/portfolio-preview.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  discountPreview,
  discountPreviewError,
  makePreview,
} from "../../msw/discount-preview.handlers"

describe("PortfolioPreviewClient", () => {
  it("posts offeringIds to the token route and returns the DiscountPreview shape", async () => {
    const capture: { body?: Record<string, unknown>; token?: string } = {}
    server.use(discountPreview(makePreview(), capture))

    const preview = await PortfolioPreviewClient.preview("tok-123", [
      "o-1",
      "o-2",
      "o-3",
    ])

    expect(capture.token).toBe("tok-123")
    expect(capture.body).toEqual({ offeringIds: ["o-1", "o-2", "o-3"] })
    expect(preview.services.count).toBe(2)
    expect(preview.services.discountPercentage).toBe(10)
    expect(preview.products.subtotal).toBe("500.00")
    expect(preview.totalBeforeDiscount).toBe("1200.00")
    expect(preview.totalDiscountAmount).toBe("200.00")
    expect(preview.totalAfterDiscount).toBe("1000.00")
  })

  it("surfaces a preview error as an ApiError", async () => {
    server.use(
      discountPreviewError("INVITATION_NOT_FOUND", "Invitation not found.", 404),
    )

    const error = await PortfolioPreviewClient.preview("bad", ["o-1"]).catch(
      (e) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("INVITATION_NOT_FOUND")
    expect(error.status).toBe(404)
  })
})
