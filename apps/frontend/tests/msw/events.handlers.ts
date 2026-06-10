import { http, HttpResponse } from "msw"
import type {
  AssignedOffering,
  ReadinessChecks,
  ReadinessReport,
  SalesEvent,
} from "@/features/events/types/event.types"
import type { Offering } from "@/features/catalog/types/offering.types"
import { apiUrl } from "./handlers"

export function makeEvent(overrides: Partial<SalesEvent> = {}): SalesEvent {
  return {
    id: "e-1",
    ownerId: "u-sales",
    name: "Annual Forge Expo",
    description: "Yearly promo event",
    capacity: 100,
    eventStartDate: "2026-09-01T09:00:00.000Z",
    eventEndDate: "2026-09-02T18:00:00.000Z",
    registrationStartDate: "2026-07-01T00:00:00.000Z",
    registrationEndDate: "2026-08-15T00:00:00.000Z",
    reservationTimeoutMinutes: 30,
    requireConfirmation: false,
    status: "draft",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeEvents(total: number): SalesEvent[] {
  return Array.from({ length: total }, (_, index) =>
    makeEvent({
      id: `e-${index + 1}`,
      name: `Event ${index + 1}`,
    }),
  )
}

export function makeOffering(overrides: Partial<Offering> = {}): Offering {
  return {
    id: "o-1",
    type: "product",
    name: "Drakescale Plate",
    description: "Premium armor",
    basePrice: "500.00",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeOfferings(total: number): Offering[] {
  return Array.from({ length: total }, (_, index) =>
    makeOffering({
      id: `o-${index + 1}`,
      name: `Offering ${index + 1}`,
      basePrice: `${100 + index}.00`,
    }),
  )
}

export function makeAssignedOffering(
  joinId: string,
  overrides: Partial<Offering> = {},
): AssignedOffering {
  const offering = makeOffering(overrides)
  return { id: joinId, offering }
}

export const allChecksReady: ReadinessChecks = {
  detailsConfigured: true,
  capacityConfigured: true,
  offeringsAssigned: true,
  rosterUploaded: true,
  rosterHasValidClient: true,
  inviteTokensReady: true,
  emailTemplateConfigured: true,
  registrationDatesValid: true,
}

export function makeReadiness(
  overrides: Partial<ReadinessChecks> = {},
  ready?: boolean,
): ReadinessReport {
  const checks = { ...allChecksReady, ...overrides }
  const computed = Object.values(checks).every(Boolean)
  return { ready: ready ?? computed, checks }
}

export const listEventsPaged = (
  all: SalesEvent[],
  capture?: { limit?: number; offset?: number },
) =>
  http.get(apiUrl("/events"), ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") ?? "10")
    const offset = Number(url.searchParams.get("offset") ?? "0")
    if (capture) {
      capture.limit = limit
      capture.offset = offset
    }
    const items = all.slice(offset, offset + limit)
    return HttpResponse.json({ success: true, data: { count: all.length, items } })
  })

export const listEventsError = () =>
  http.get(apiUrl("/events"), () =>
    HttpResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Boom." },
      { status: 500 },
    ),
  )

export const getEvent = (event: SalesEvent) =>
  http.get(apiUrl(`/events/${event.id}`), () =>
    HttpResponse.json({ success: true, data: event }),
  )

export const getEventNotFound = (id: string) =>
  http.get(apiUrl(`/events/${id}`), () =>
    HttpResponse.json(
      { success: false, code: "EVENT_NOT_FOUND", message: "Event not found." },
      { status: 404 },
    ),
  )

export const createEventSuccess = (
  capture?: { body?: Record<string, unknown> },
  event: SalesEvent = makeEvent({ id: "e-new" }),
) =>
  http.post(apiUrl("/events"), async ({ request }) => {
    if (capture) {
      capture.body = (await request.json()) as Record<string, unknown>
    }
    return HttpResponse.json({ success: true, data: event }, { status: 201 })
  })

export const patchEvent = (
  resolve: (id: string, body: Record<string, unknown>) => SalesEvent,
  capture?: { body?: Record<string, unknown>; id?: string; calls?: number },
) =>
  http.patch(apiUrl("/events/:eventId"), async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const id = params.eventId as string
    if (capture) {
      capture.body = body
      capture.id = id
      capture.calls = (capture.calls ?? 0) + 1
    }
    return HttpResponse.json({ success: true, data: resolve(id, body) })
  })

export const patchEventError = (
  code: string,
  message: string,
  status = 409,
  details?: unknown,
) =>
  http.patch(apiUrl("/events/:eventId"), () =>
    HttpResponse.json(
      { success: false, code, message, details },
      { status },
    ),
  )

export const getReadiness = (report: ReadinessReport) =>
  http.get(apiUrl("/events/:eventId/readiness"), () =>
    HttpResponse.json({ success: true, data: report }),
  )

export const getReadinessError = () =>
  http.get(apiUrl("/events/:eventId/readiness"), () =>
    HttpResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Boom." },
      { status: 500 },
    ),
  )

export const listEventOfferings = (items: AssignedOffering[]) =>
  http.get(apiUrl("/events/:eventId/offerings"), () =>
    HttpResponse.json({ success: true, data: { items } }),
  )

export const listEventOfferingsError = () =>
  http.get(apiUrl("/events/:eventId/offerings"), () =>
    HttpResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Boom." },
      { status: 500 },
    ),
  )

export const assignOfferingSuccess = (
  capture?: { body?: Record<string, unknown>; eventId?: string },
) =>
  http.post(apiUrl("/events/:eventId/offerings"), async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (capture) {
      capture.body = body
      capture.eventId = params.eventId as string
    }
    const offeringId = body.offeringId as string
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: `eo-${offeringId}`,
          eventId: params.eventId as string,
          offeringId,
          offering: makeOffering({ id: offeringId }),
        },
      },
      { status: 201 },
    )
  })

export const removeOfferingSuccess = (
  capture?: { eventOfferingId?: string; eventId?: string },
) =>
  http.delete(
    apiUrl("/events/:eventId/offerings/:eventOfferingId"),
    ({ params }) => {
      if (capture) {
        capture.eventId = params.eventId as string
        capture.eventOfferingId = params.eventOfferingId as string
      }
      return HttpResponse.json({ success: true, data: null })
    },
  )

export const listCatalogPaged = (
  all: Offering[],
  capture?: { active?: string | null; limit?: number; offset?: number; type?: string | null },
) =>
  http.get(apiUrl("/offerings"), ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") ?? "10")
    const offset = Number(url.searchParams.get("offset") ?? "0")
    if (capture) {
      capture.active = url.searchParams.get("active")
      capture.type = url.searchParams.get("type")
      capture.limit = limit
      capture.offset = offset
    }
    const items = all.slice(offset, offset + limit)
    return HttpResponse.json({ success: true, data: { count: all.length, items } })
  })

export const listCatalogError = () =>
  http.get(apiUrl("/offerings"), () =>
    HttpResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Boom." },
      { status: 500 },
    ),
  )
