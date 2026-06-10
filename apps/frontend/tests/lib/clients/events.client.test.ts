import { describe, expect, it } from "vitest"
import { EventsClient } from "@/lib/clients/events.client"
import { EventOfferingsClient } from "@/lib/clients/event-offerings.client"
import { ApiError } from "@/lib/errors/api.error"
import { server } from "../../msw/server"
import {
  assignOfferingSuccess,
  createEventSuccess,
  getEvent,
  getReadiness,
  listEventOfferings,
  listEventsPaged,
  makeAssignedOffering,
  makeEvent,
  makeEvents,
  makeReadiness,
  patchEvent,
  patchEventError,
  removeOfferingSuccess,
} from "../../msw/events.handlers"

describe("EventsClient", () => {
  it("list returns { count, items } and forwards limit/offset", async () => {
    const all = makeEvents(25)
    const capture: { limit?: number; offset?: number } = {}
    server.use(listEventsPaged(all, capture))

    const result = await EventsClient.list({ limit: 10, offset: 20 })

    expect(capture.limit).toBe(10)
    expect(capture.offset).toBe(20)
    expect(result.count).toBe(25)
    expect(result.items).toHaveLength(5)
    expect(result.items[0].id).toBe("e-21")
  })

  it("getById returns the event", async () => {
    server.use(getEvent(makeEvent({ id: "e-7", name: "Detail" })))

    const result = await EventsClient.getById("e-7")

    expect(result.id).toBe("e-7")
    expect(result.name).toBe("Detail")
  })

  it("create POSTs the field body and returns the created event", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createEventSuccess(capture, makeEvent({ id: "e-new" })))

    const result = await EventsClient.create({
      name: "New Expo",
      capacity: 50,
      eventStartDate: "2026-09-01T09:00:00.000Z",
      registrationStartDate: "2026-07-01T00:00:00.000Z",
      registrationEndDate: "2026-08-15T00:00:00.000Z",
    })

    expect(capture.body?.name).toBe("New Expo")
    expect(capture.body?.capacity).toBe(50)
    expect(capture.body).not.toHaveProperty("status")
    expect(result.id).toBe("e-new")
  })

  it("update PATCHes /events/:id with the field patch (no status)", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(patchEvent((id) => makeEvent({ id }), capture))

    await EventsClient.update("e-3", { name: "Renamed", capacity: 80 })

    expect(capture.id).toBe("e-3")
    expect(capture.body?.name).toBe("Renamed")
    expect(capture.body?.capacity).toBe(80)
    expect(capture.body).not.toHaveProperty("status")
  })

  it("transition PATCHes /events/:id with only { status }", async () => {
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(patchEvent((id) => makeEvent({ id, status: "active" }), capture))

    const result = await EventsClient.transition("e-3", "active")

    expect(capture.id).toBe("e-3")
    expect(capture.body).toEqual({ status: "active" })
    expect(result.status).toBe("active")
  })

  it("transition surfaces EVENT_NOT_READY with details.checks on 409", async () => {
    server.use(
      patchEventError("EVENT_NOT_READY", "Not ready.", 409, {
        checks: makeReadiness({ offeringsAssigned: false }).checks,
      }),
    )

    await expect(EventsClient.transition("e-3", "active")).rejects.toMatchObject({
      code: "EVENT_NOT_READY",
      status: 409,
    })
    try {
      await EventsClient.transition("e-3", "active")
    } catch (error) {
      const apiError = error as ApiError
      expect(apiError).toBeInstanceOf(ApiError)
      const details = apiError.details as { checks: { offeringsAssigned: boolean } }
      expect(details.checks.offeringsAssigned).toBe(false)
    }
  })

  it("getReadiness returns { ready, checks }", async () => {
    server.use(getReadiness(makeReadiness({ offeringsAssigned: false })))

    const result = await EventsClient.getReadiness("e-1")

    expect(result.ready).toBe(false)
    expect(result.checks.offeringsAssigned).toBe(false)
    expect(result.checks.detailsConfigured).toBe(true)
  })
})

describe("EventOfferingsClient", () => {
  it("listForEvent unwraps { items } and returns the assigned offerings with join ids", async () => {
    server.use(
      listEventOfferings([
        makeAssignedOffering("eo-1", { id: "o-1" }),
        makeAssignedOffering("eo-2", { id: "o-2" }),
      ]),
    )

    const result = await EventOfferingsClient.listForEvent("e-1")

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("eo-1")
    expect(result[0].offering.id).toBe("o-1")
  })

  it("assign POSTs { offeringId } and returns the join row", async () => {
    const capture: { body?: Record<string, unknown>; eventId?: string } = {}
    server.use(assignOfferingSuccess(capture))

    const result = await EventOfferingsClient.assign("e-1", "o-9")

    expect(capture.eventId).toBe("e-1")
    expect(capture.body).toEqual({ offeringId: "o-9" })
    expect(result.offeringId).toBe("o-9")
  })

  it("remove DELETEs /events/:id/offerings/:eventOfferingId", async () => {
    const capture: { eventOfferingId?: string; eventId?: string } = {}
    server.use(removeOfferingSuccess(capture))

    const result = await EventOfferingsClient.remove("e-1", "eo-5")

    expect(capture.eventId).toBe("e-1")
    expect(capture.eventOfferingId).toBe("eo-5")
    expect(result).toBeNull()
  })
})
