import { http, HttpResponse } from "msw"
import type { Offering } from "@/features/catalog/types/offering.types"
import { apiUrl } from "./handlers"

export function makeOffering(overrides: Partial<Offering> = {}): Offering {
  return {
    id: "o-1",
    type: "product",
    name: "Drakescale Plate",
    description: "Premium armor",
    basePrice: "1200.00",
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
      type: index % 2 === 0 ? "product" : "service",
      basePrice: `${100 + index}.00`,
    }),
  )
}

export const listOfferingsPaged = (
  all: Offering[],
  capture?: {
    type?: string | null
    isActive?: string | null
    search?: string | null
    limit?: number
    offset?: number
  },
) =>
  http.get(apiUrl("/offerings"), ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") ?? "10")
    const offset = Number(url.searchParams.get("offset") ?? "0")
    const type = url.searchParams.get("type")
    const isActive = url.searchParams.get("isActive")
    const search = url.searchParams.get("search")
    if (capture) {
      capture.type = type
      capture.isActive = isActive
      capture.search = search
      capture.limit = limit
      capture.offset = offset
    }

    const items = all.slice(offset, offset + limit)
    return HttpResponse.json({
      success: true,
      data: { count: all.length, items },
    })
  })

export const listOfferingsError = () =>
  http.get(apiUrl("/offerings"), () =>
    HttpResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Boom." },
      { status: 500 },
    ),
  )

export const getOffering = (offering: Offering) =>
  http.get(apiUrl(`/offerings/${offering.id}`), () =>
    HttpResponse.json({ success: true, data: offering }),
  )

export const getOfferingNotFound = (id: string) =>
  http.get(apiUrl(`/offerings/${id}`), () =>
    HttpResponse.json(
      {
        success: false,
        code: "OFFERING_NOT_FOUND",
        message: "Offering not found.",
      },
      { status: 404 },
    ),
  )

export const createOfferingSuccess = (
  capture?: { body?: Record<string, unknown> },
  offering: Offering = makeOffering({ id: "o-new" }),
) =>
  http.post(apiUrl("/offerings"), async ({ request }) => {
    if (capture) {
      capture.body = (await request.json()) as Record<string, unknown>
    }
    return HttpResponse.json({ success: true, data: offering }, { status: 201 })
  })

export const createOfferingConflict = () =>
  http.post(apiUrl("/offerings"), () =>
    HttpResponse.json(
      {
        success: false,
        code: "DUPLICATE_OFFERING",
        message: "An offering with this name and type already exists.",
      },
      { status: 409 },
    ),
  )

export const patchOffering = (
  resolve: (id: string, body: Record<string, unknown>) => Offering,
  capture?: { body?: Record<string, unknown>; id?: string },
) =>
  http.patch(apiUrl("/offerings/:offeringId"), async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const id = params.offeringId as string
    if (capture) {
      capture.body = body
      capture.id = id
    }
    return HttpResponse.json({ success: true, data: resolve(id, body) })
  })

export const deleteOffering = (
  resolve: (id: string) => Offering,
  capture?: { id?: string },
) =>
  http.delete(apiUrl("/offerings/:offeringId"), ({ params }) => {
    const id = params.offeringId as string
    if (capture) capture.id = id
    return HttpResponse.json({ success: true, data: resolve(id) })
  })
