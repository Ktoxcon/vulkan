import { request } from "@/lib/clients/http.client"
import type { AssignedOffering, EventOffering } from "@/features/events/types/event.types"

async function listForEvent(eventId: string): Promise<AssignedOffering[]> {
  const { items } = await request<{ items: AssignedOffering[] }>(
    `/events/${eventId}/offerings`
  )
  return items
}

async function assign(eventId: string, offeringId: string): Promise<EventOffering> {
  return request<EventOffering>(`/events/${eventId}/offerings`, {
    method: "POST",
    body: { offeringId },
  })
}

async function remove(eventId: string, eventOfferingId: string): Promise<null> {
  return request<null>(`/events/${eventId}/offerings/${eventOfferingId}`, {
    method: "DELETE",
  })
}

export const EventOfferingsClient = { listForEvent, assign, remove }
