import { http, HttpResponse } from "msw"
import { apiUrl } from "./handlers"
import type {
  ClientOffering,
  ConfirmationResult,
  DraftView,
  EventContext,
  FlowDraftData,
  GroupedOfferings,
  ReservationView,
  TokenResolution,
} from "@/features/invitation-flow/types/invitation-flow.types"

const TOKEN = "tok-valid"

export const validToken = TOKEN

export const makeEvent = (overrides: Partial<EventContext> = {}): EventContext => ({
  id: "e-1",
  name: "Nocturne Forge Summit",
  status: "registration_open",
  eventStartDate: "2026-07-01T00:00:00.000Z",
  eventEndDate: "2026-07-01T00:00:00.000Z",
  registrationStartDate: "2026-06-01T00:00:00.000Z",
  registrationEndDate: "2026-06-30T00:00:00.000Z",
  capacity: 100,
  isMultiDay: false,
  availableAttendanceDates: ["2026-07-01"],
  ...overrides,
})

export const makeMultiDayEvent = (): EventContext =>
  makeEvent({
    isMultiDay: true,
    eventStartDate: "2026-07-01T00:00:00.000Z",
    eventEndDate: "2026-07-03T00:00:00.000Z",
    availableAttendanceDates: ["2026-07-01", "2026-07-02", "2026-07-03"],
  })

export const makeResolution = (
  overrides: Partial<TokenResolution> = {},
): TokenResolution => ({
  event: makeEvent(),
  client: {
    id: "c-1",
    name: "Vulcan Hestan",
    email: "vulcan@nocturne.test",
    company: "Forgemasters",
  },
  confirmation: { confirmed: false, confirmedAt: null },
  hasDraft: false,
  eligible: true,
  reason: null,
  ...overrides,
})

export const makeOfferings = (
  overrides: Partial<GroupedOfferings> = {},
): GroupedOfferings => ({
  products: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Drakescale Plate",
      description: "Heavy armor",
      basePrice: "1200.00",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Forge Hammer",
      description: null,
      basePrice: "450.00",
    },
  ],
  services: [
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Armor Fitting",
      description: "On-site service",
      basePrice: "99.00",
    },
  ],
  ...overrides,
})

export const productId = "11111111-1111-1111-1111-111111111111"
export const serviceId = "33333333-3333-3333-3333-333333333333"

export const makeReservation = (
  overrides: Partial<ReservationView> = {},
): ReservationView => ({
  id: "r-1",
  eventId: "e-1",
  invitationId: "i-1",
  status: "active",
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  ...overrides,
})

export const makeDraftView = (
  data: FlowDraftData = {},
  updatedAt: string | null = null,
): DraftView => ({ data, updatedAt })

export const makeConfirmationResult = (
  overrides: Partial<ConfirmationResult> = {},
): ConfirmationResult => ({
  message: "Your attendance is confirmed.",
  confirmationId: "conf-1",
  confirmedAt: "2026-06-10T00:00:00.000Z",
  attendanceDate: "2026-07-01",
  event: {
    id: "e-1",
    name: "Nocturne Forge Summit",
    eventStartDate: "2026-07-01T00:00:00.000Z",
    eventEndDate: "2026-07-01T00:00:00.000Z",
  },
  interests: {
    products: [{ offeringId: productId, name: "Drakescale Plate" }],
    services: [{ offeringId: serviceId, name: "Armor Fitting" }],
  },
  ...overrides,
})

export const resolveToken = (
  resolution: TokenResolution = makeResolution(),
  token = TOKEN,
) =>
  http.get(apiUrl(`/invitations/${token}`), () =>
    HttpResponse.json({ success: true, data: resolution }),
  )

export const resolveTokenInvalid = (token = TOKEN) =>
  http.get(apiUrl(`/invitations/${token}`), () =>
    HttpResponse.json(
      {
        success: false,
        code: "INVALID_TOKEN",
        message: "This invitation link is not valid.",
      },
      { status: 404 },
    ),
  )

export const getOfferings = (
  offerings: GroupedOfferings = makeOfferings(),
  token = TOKEN,
) =>
  http.get(apiUrl(`/invitations/${token}/offerings`), () =>
    HttpResponse.json({ success: true, data: offerings }),
  )

export const getDraft = (view: DraftView = makeDraftView(), token = TOKEN) =>
  http.get(apiUrl(`/invitations/${token}/draft`), () =>
    HttpResponse.json({ success: true, data: view }),
  )

export const saveDraft = (
  capture?: { calls: FlowDraftData[] },
  token = TOKEN,
) =>
  http.put(apiUrl(`/invitations/${token}/draft`), async ({ request }) => {
    const payload = (await request.json()) as { data: FlowDraftData }
    if (capture) capture.calls.push(payload.data)
    return HttpResponse.json({
      success: true,
      data: makeDraftView(payload.data, new Date().toISOString()),
    })
  })

export const saveDraftRejectingInvalid = (
  capture: { calls: FlowDraftData[] },
  token = TOKEN,
) =>
  http.put(apiUrl(`/invitations/${token}/draft`), async ({ request }) => {
    const payload = (await request.json()) as { data: FlowDraftData }
    capture.calls.push(payload.data)
    if (payload.data.email !== undefined) {
      return HttpResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "Invalid draft.",
        },
        { status: 400 },
      )
    }
    return HttpResponse.json({
      success: true,
      data: makeDraftView(payload.data, new Date().toISOString()),
    })
  })

export const createReservation = (
  reservation: ReservationView = makeReservation(),
  options: { status?: 200 | 201; capture?: { count: number } } = {},
  token = TOKEN,
) =>
  http.post(apiUrl(`/invitations/${token}/reservation`), () => {
    if (options.capture) options.capture.count += 1
    return HttpResponse.json(
      { success: true, data: reservation },
      { status: options.status ?? 201 },
    )
  })

export const createReservationFull = (token = TOKEN) =>
  http.post(apiUrl(`/invitations/${token}/reservation`), () =>
    HttpResponse.json(
      {
        success: false,
        code: "CAPACITY_REACHED",
        message: "This event is full.",
      },
      { status: 409 },
    ),
  )

export const confirm = (
  result: ConfirmationResult = makeConfirmationResult(),
  capture?: { bodies: Array<Record<string, unknown>> },
  token = TOKEN,
) =>
  http.post(apiUrl(`/invitations/${token}/confirmation`), async ({ request }) => {
    if (capture)
      capture.bodies.push((await request.json()) as Record<string, unknown>)
    return HttpResponse.json({ success: true, data: result }, { status: 201 })
  })

export const confirmError = (
  code: string,
  status = 409,
  message = "Confirmation failed.",
  token = TOKEN,
) =>
  http.post(apiUrl(`/invitations/${token}/confirmation`), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const selectedOffering = (overrides: Partial<ClientOffering> = {}): ClientOffering => ({
  id: productId,
  name: "Drakescale Plate",
  description: "Heavy armor",
  basePrice: "1200.00",
  ...overrides,
})
