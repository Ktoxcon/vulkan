import { downloadFile, request } from "@/lib/clients/http.client"
import type {
  DispatchProgress,
  DispatchResult,
  GenerateResult,
  InvitationListView,
  InvitationStatus,
} from "@/features/invitations/types/invitation.types"

async function generate(eventId: string): Promise<GenerateResult> {
  return request<GenerateResult>(`/events/${eventId}/invitations`, { method: "POST" })
}

async function list(
  eventId: string,
  params: { status?: InvitationStatus } = {}
): Promise<InvitationListView> {
  const query = new URLSearchParams()
  if (params.status !== undefined) query.set("status", params.status)
  const suffix = query.toString() ? `?${query.toString()}` : ""
  return request<InvitationListView>(`/events/${eventId}/invitations${suffix}`)
}

async function downloadReport(eventId: string): Promise<void> {
  return downloadFile(`/events/${eventId}/invitations/report`, "invitations.csv")
}

async function dispatch(eventId: string): Promise<DispatchResult> {
  return request<DispatchResult>(`/events/${eventId}/invitation-dispatches`, {
    method: "POST",
  })
}

async function getDispatch(eventId: string, dispatchId: string): Promise<DispatchProgress> {
  return request<DispatchProgress>(
    `/events/${eventId}/invitation-dispatches/${dispatchId}`
  )
}

export const InvitationsClient = {
  generate,
  list,
  downloadReport,
  dispatch,
  getDispatch,
}
