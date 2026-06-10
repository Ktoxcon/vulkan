import { request } from "@/lib/clients/http.client"
import type {
  ConfirmationResult,
  ConfirmInput,
  DraftView,
  FlowDraftData,
  GroupedOfferings,
  ReservationView,
  TokenResolution,
} from "@/features/invitation-flow/types/invitation-flow.types"

async function resolve(token: string): Promise<TokenResolution> {
  return request<TokenResolution>(`/invitations/${token}`)
}

async function getOfferings(token: string): Promise<GroupedOfferings> {
  return request<GroupedOfferings>(`/invitations/${token}/offerings`)
}

async function getDraft(token: string): Promise<DraftView> {
  return request<DraftView>(`/invitations/${token}/draft`)
}

async function saveDraft(token: string, data: FlowDraftData): Promise<DraftView> {
  return request<DraftView>(`/invitations/${token}/draft`, {
    method: "PUT",
    body: { data },
  })
}

async function createReservation(token: string): Promise<ReservationView> {
  return request<ReservationView>(`/invitations/${token}/reservation`, {
    method: "POST",
  })
}

async function confirm(token: string, input: ConfirmInput): Promise<ConfirmationResult> {
  return request<ConfirmationResult>(`/invitations/${token}/confirmation`, {
    method: "POST",
    body: input,
  })
}

export const InvitationFlowClient = {
  resolve,
  getOfferings,
  getDraft,
  saveDraft,
  createReservation,
  confirm,
}
