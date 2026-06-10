import { request } from "@/lib/clients/http.client"
import type {
  CreateEventInput,
  EventListResult,
  EventStatus,
  ReadinessReport,
  SalesEvent,
  UpdateEventInput,
} from "@/features/events/types/event.types"

async function list(params: { limit: number; offset: number }): Promise<EventListResult> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  })
  return request<EventListResult>(`/events?${query.toString()}`)
}

async function getById(id: string): Promise<SalesEvent> {
  return request<SalesEvent>(`/events/${id}`)
}

async function create(input: CreateEventInput): Promise<SalesEvent> {
  return request<SalesEvent>("/events", { method: "POST", body: input })
}

async function update(id: string, fields: UpdateEventInput): Promise<SalesEvent> {
  return request<SalesEvent>(`/events/${id}`, { method: "PATCH", body: fields })
}

async function transition(id: string, status: EventStatus): Promise<SalesEvent> {
  return request<SalesEvent>(`/events/${id}`, { method: "PATCH", body: { status } })
}

async function getReadiness(id: string): Promise<ReadinessReport> {
  return request<ReadinessReport>(`/events/${id}/readiness`)
}

export const EventsClient = { list, getById, create, update, transition, getReadiness }
