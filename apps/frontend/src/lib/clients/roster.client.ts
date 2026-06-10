import { request } from "@/lib/clients/http.client"
import type {
  AddRosterClientInput,
  ImportRecord,
  Roster,
  RosterMember,
  RosterView,
} from "@/features/roster/types/roster.types"

async function createImport(eventId: string, file: File): Promise<ImportRecord> {
  const formData = new FormData()
  formData.append("file", file)
  return request<ImportRecord>(`/events/${eventId}/roster-imports`, {
    method: "POST",
    body: formData,
  })
}

async function getImport(eventId: string, importId: string): Promise<ImportRecord> {
  return request<ImportRecord>(`/events/${eventId}/roster-imports/${importId}`)
}

async function confirmImport(eventId: string, importId: string): Promise<Roster> {
  return request<Roster>(`/events/${eventId}/roster-imports/${importId}`, {
    method: "PATCH",
    body: { status: "confirmed" },
  })
}

async function getRoster(eventId: string): Promise<RosterView> {
  return request<RosterView>(`/events/${eventId}/roster`)
}

async function addClient(
  eventId: string,
  input: AddRosterClientInput,
): Promise<RosterMember> {
  return request<RosterMember>(`/events/${eventId}/roster-clients`, {
    method: "POST",
    body: input,
  })
}

export const RosterClient = {
  createImport,
  getImport,
  confirmImport,
  getRoster,
  addClient,
}
