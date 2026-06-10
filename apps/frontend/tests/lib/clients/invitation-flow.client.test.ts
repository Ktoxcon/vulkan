import { describe, expect, it } from "vitest"
import { InvitationFlowClient } from "@/lib/clients/invitation-flow.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  confirm,
  createReservation,
  getDraft,
  getOfferings,
  makeConfirmationResult,
  makeDraftView,
  makeOfferings,
  makeReservation,
  makeResolution,
  productId,
  resolveToken,
  resolveTokenInvalid,
  saveDraft,
  serviceId,
  validToken,
} from "../../msw/invitation-flow.handlers"
import type { FlowDraftData } from "@/features/invitation-flow/types/invitation-flow.types"

describe("InvitationFlowClient", () => {
  it("resolves a known token to the resolution view", async () => {
    server.use(resolveToken(makeResolution({ hasDraft: true })))

    const view = await InvitationFlowClient.resolve(validToken)

    expect(view.eligible).toBe(true)
    expect(view.hasDraft).toBe(true)
    expect(view.client.name).toBe("Vulcan Hestan")
  })

  it("REJECTS with ApiError when the token is unknown (INVALID_TOKEN, non-200)", async () => {
    server.use(resolveTokenInvalid())

    const error = await InvitationFlowClient.resolve(validToken).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe("INVALID_TOKEN")
  })

  it("fetches grouped offerings", async () => {
    server.use(getOfferings(makeOfferings()))

    const offerings = await InvitationFlowClient.getOfferings(validToken)

    expect(offerings.products).toHaveLength(2)
    expect(offerings.services).toHaveLength(1)
    expect(offerings.products[0].basePrice).toBe("1200.00")
  })

  it("returns the double-nested draft view with split product/service ids", async () => {
    server.use(
      getDraft(
        makeDraftView(
          { productIds: [productId], serviceIds: [serviceId], attendanceDate: "2026-07-01" },
          "2026-06-05T00:00:00.000Z",
        ),
      ),
    )

    const view = await InvitationFlowClient.getDraft(validToken)

    expect(view.updatedAt).toBe("2026-06-05T00:00:00.000Z")
    expect(view.data.productIds).toEqual([productId])
    expect(view.data.serviceIds).toEqual([serviceId])
  })

  it("models an empty draft as { data: {}, updatedAt: null } (not null)", async () => {
    server.use(getDraft(makeDraftView({}, null)))

    const view = await InvitationFlowClient.getDraft(validToken)

    expect(view.data).toEqual({})
    expect(view.updatedAt).toBeNull()
  })

  it("PUTs the draft wrapped in { data } and keeps ids split", async () => {
    const capture = { calls: [] as FlowDraftData[] }
    server.use(saveDraft(capture))

    await InvitationFlowClient.saveDraft(validToken, {
      productIds: [productId],
      serviceIds: [serviceId],
    })

    expect(capture.calls[0]).toEqual({
      productIds: [productId],
      serviceIds: [serviceId],
    })
  })

  it("creates a reservation and returns the reservation object directly (no wrapper)", async () => {
    server.use(createReservation(makeReservation({ id: "r-9", status: "active" })))

    const reservation = await InvitationFlowClient.createReservation(validToken)

    expect(reservation.id).toBe("r-9")
    expect(reservation.status).toBe("active")
    expect(reservation).not.toHaveProperty("reservation")
    expect(reservation).not.toHaveProperty("created")
  })

  it("confirms with a combined offeringIds array and returns the result", async () => {
    const capture = { bodies: [] as Array<Record<string, unknown>> }
    server.use(confirm(makeConfirmationResult(), capture))

    const result = await InvitationFlowClient.confirm(validToken, {
      firstName: "Vulcan",
      lastName: "Hestan",
      email: "vulcan@nocturne.test",
      attendanceDate: "2026-07-01",
      offeringIds: [productId, serviceId],
    })

    expect(capture.bodies[0].offeringIds).toEqual([productId, serviceId])
    expect(result.confirmationId).toBe("conf-1")
    expect(result.interests.products[0].name).toBe("Drakescale Plate")
  })
})
