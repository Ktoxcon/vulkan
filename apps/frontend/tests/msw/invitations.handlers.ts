import { http, HttpResponse } from "msw"
import type {
  DispatchProgress,
  DispatchResult,
  GenerateResult,
  InvitationListItem,
  InvitationListView,
  InvitationMonitoring,
  InvitationStatus,
} from "@/features/invitations/types/invitation.types"
import { apiUrl } from "./handlers"

export function makeMonitoring(
  overrides: Partial<InvitationMonitoring> = {},
): InvitationMonitoring {
  return {
    total: 3,
    pending: 3,
    queued: 0,
    processing: 0,
    sent: 0,
    opened: 0,
    failed: 0,
    confirmed: 0,
    ...overrides,
  }
}

export function makeInvitationItem(
  id: string,
  email: string,
  status: InvitationStatus,
  overrides: Partial<InvitationListItem["invitation"]> = {},
): InvitationListItem {
  return {
    invitation: {
      id,
      token: `tok-${id}`,
      status,
      sentAt: null,
      openedAt: null,
      confirmedAt: null,
      ...overrides,
    },
    client: { id: `c-${id}`, name: email, email, company: null },
  }
}

export function makeListView(
  overrides: Partial<InvitationListView> = {},
): InvitationListView {
  return {
    invitations: [
      makeInvitationItem("i-1", "raphen@drake.test", "pending"),
      makeInvitationItem("i-2", "vulkan@drake.test", "sent", {
        sentAt: "2026-06-02T10:00:00.000Z",
      }),
      makeInvitationItem("i-3", "tushan@drake.test", "opened", {
        sentAt: "2026-06-02T10:00:00.000Z",
        openedAt: "2026-06-02T11:00:00.000Z",
      }),
    ],
    monitoring: makeMonitoring({ pending: 1, sent: 1, opened: 1 }),
    ...overrides,
  }
}

export const generateInvitations = (
  result: GenerateResult = {
    created: [],
    createdCount: 3,
    totalRosterClients: 3,
    alreadyExistingCount: 0,
  },
  capture?: { calls?: number },
) =>
  http.post(apiUrl("/events/:eventId/invitations"), () => {
    if (capture) capture.calls = (capture.calls ?? 0) + 1
    return HttpResponse.json({ success: true, data: result })
  })

export const generateInvitationsError = (
  code = "INVITATIONS_ROSTER_MISSING",
  message = "No roster.",
  status = 409,
) =>
  http.post(apiUrl("/events/:eventId/invitations"), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const listInvitations = (
  resolve: (status: string | null) => InvitationListView = () => makeListView(),
  capture?: { status?: string | null; calls?: number },
) =>
  http.get(apiUrl("/events/:eventId/invitations"), ({ request }) => {
    const status = new URL(request.url).searchParams.get("status")
    if (capture) {
      capture.status = status
      capture.calls = (capture.calls ?? 0) + 1
    }
    return HttpResponse.json({ success: true, data: resolve(status) })
  })

export const downloadReport = (
  csv = "email,status,sentAt,openedAt,confirmedAt\nraphen@drake.test,pending,,,\n",
  capture?: { calls?: number },
) =>
  http.get(apiUrl("/events/:eventId/invitations/report"), () => {
    if (capture) capture.calls = (capture.calls ?? 0) + 1
    return HttpResponse.text(csv, {
      headers: { "Content-Type": "text/csv" },
    })
  })

export const createDispatch = (
  result: DispatchResult = {
    dispatchId: "d-1",
    queuedCount: 3,
    totalInvitations: 3,
    progress: makeProgress("d-1", { pending: 0, queued: 3 }),
  },
  capture?: { calls?: number },
) =>
  http.post(apiUrl("/events/:eventId/invitation-dispatches"), () => {
    if (capture) capture.calls = (capture.calls ?? 0) + 1
    return HttpResponse.json({ success: true, data: result }, { status: 202 })
  })

export const createDispatchError = (
  code = "DISPATCH_TEMPLATE_MISSING",
  message = "No template.",
  status = 409,
) =>
  http.post(apiUrl("/events/:eventId/invitation-dispatches"), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export function makeProgress(
  dispatchId: string,
  overrides: Partial<DispatchProgress> = {},
): DispatchProgress {
  return {
    dispatchId,
    total: 3,
    pending: 3,
    queued: 0,
    processing: 0,
    sent: 0,
    opened: 0,
    failed: 0,
    confirmed: 0,
    ...overrides,
  }
}

export const getDispatch = (
  resolve: () => DispatchProgress = () => makeProgress("d-1"),
) =>
  http.get(apiUrl("/events/:eventId/invitation-dispatches/:dispatchId"), () =>
    HttpResponse.json({ success: true, data: resolve() }),
  )
