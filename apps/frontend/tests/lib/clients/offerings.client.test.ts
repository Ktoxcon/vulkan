import { describe, expect, it } from "vitest"
import { OfferingsClient } from "@/lib/clients/offerings.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  createOfferingConflict,
  createOfferingSuccess,
  deleteOffering,
  getOffering,
  getOfferingNotFound,
  listOfferingsPaged,
  makeOffering,
  makeOfferings,
  patchOffering,
} from "../../msw/offerings.handlers"

describe("OfferingsClient", () => {
  it("list forwards type/isActive/search/limit/offset and returns { count, items }", async () => {
    const capture: {
      type?: string | null
      isActive?: string | null
      search?: string | null
      limit?: number
      offset?: number
    } = {}
    server.use(listOfferingsPaged(makeOfferings(12), capture))

    const result = await OfferingsClient.list({
      type: "product",
      isActive: true,
      search: "forge",
      limit: 10,
      offset: 0,
    })

    expect(capture.type).toBe("product")
    expect(capture.isActive).toBe("true")
    expect(capture.search).toBe("forge")
    expect(capture.limit).toBe(10)
    expect(capture.offset).toBe(0)
    expect(result).toHaveProperty("count")
    expect(result).toHaveProperty("items")
  })

  it("list sends isActive=false (not omitted) when filtering inactive", async () => {
    const capture: { isActive?: string | null } = {}
    server.use(listOfferingsPaged(makeOfferings(2), capture))

    await OfferingsClient.list({ isActive: false })

    expect(capture.isActive).toBe("false")
  })

  it("list omits filters that are undefined", async () => {
    const capture: {
      type?: string | null
      isActive?: string | null
      search?: string | null
    } = {}
    server.use(listOfferingsPaged(makeOfferings(3), capture))

    await OfferingsClient.list({})

    expect(capture.type).toBeNull()
    expect(capture.isActive).toBeNull()
    expect(capture.search).toBeNull()
  })

  it("getById returns the offering with a string basePrice", async () => {
    server.use(getOffering(makeOffering({ id: "o-7", basePrice: "1200.00" })))

    const result = await OfferingsClient.getById("o-7")

    expect(result.id).toBe("o-7")
    expect(result.basePrice).toBe("1200.00")
    expect(typeof result.basePrice).toBe("string")
  })

  it("getById surfaces a 404 OFFERING_NOT_FOUND ApiError", async () => {
    server.use(getOfferingNotFound("missing"))

    await expect(OfferingsClient.getById("missing")).rejects.toMatchObject({
      code: "OFFERING_NOT_FOUND",
      status: 404,
    })
  })

  it("create POSTs the input body and returns the created offering", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createOfferingSuccess(capture, makeOffering({ id: "o-new" })))

    const result = await OfferingsClient.create({
      type: "service",
      name: "Tactical Briefing",
      description: "A briefing",
      basePrice: 250,
      isActive: true,
    })

    expect(capture.body?.type).toBe("service")
    expect(capture.body?.name).toBe("Tactical Briefing")
    expect(capture.body?.basePrice).toBe(250)
    expect(result.id).toBe("o-new")
  })

  it("create surfaces a 409 DUPLICATE_OFFERING ApiError", async () => {
    server.use(createOfferingConflict())

    try {
      await OfferingsClient.create({
        type: "product",
        name: "Drakescale Plate",
        basePrice: 100,
      })
      expect.unreachable("create should reject")
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).code).toBe("DUPLICATE_OFFERING")
      expect((error as ApiError).status).toBe(409)
    }
  })

  it("update PATCHes the partial without a type field", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(patchOffering((id) => makeOffering({ id }), capture))

    await OfferingsClient.update("o-3", { name: "Renamed", basePrice: 999 })

    expect(capture.id).toBe("o-3")
    expect(capture.body?.name).toBe("Renamed")
    expect(capture.body?.basePrice).toBe(999)
    expect(capture.body).not.toHaveProperty("type")
  })

  it("deactivate DELETEs /offerings/:id and returns the soft-deleted offering", async () => {
    const capture: { id?: string } = {}
    server.use(
      deleteOffering((id) => makeOffering({ id, isActive: false }), capture),
    )

    const result = await OfferingsClient.deactivate("o-3")

    expect(capture.id).toBe("o-3")
    expect(result.isActive).toBe(false)
  })
})
