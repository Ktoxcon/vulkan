import type { Offering } from "@/features/catalog/types/offering.types"

export type EventStatus = "draft" | "active" | "paused" | "closed"

export type SalesEvent = {
  id: string
  ownerId: string
  name: string
  description?: string
  capacity: number
  eventStartDate: string
  eventEndDate?: string
  registrationStartDate: string
  registrationEndDate: string
  reservationTimeoutMinutes: number
  requireConfirmation: boolean
  status: EventStatus
  createdAt: string
  updatedAt: string
}

export type CreateEventInput = {
  name: string
  description?: string
  capacity: number
  reservationTimeoutMinutes?: number
  requireConfirmation?: boolean
  eventStartDate: string
  eventEndDate?: string
  registrationStartDate: string
  registrationEndDate: string
}

export type UpdateEventInput = {
  name?: string
  description?: string
  capacity?: number
  reservationTimeoutMinutes?: number
  requireConfirmation?: boolean
  eventStartDate?: string
  eventEndDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
}

export type EventListResult = {
  count: number
  items: SalesEvent[]
}

export type ReadinessChecks = {
  detailsConfigured: boolean
  capacityConfigured: boolean
  offeringsAssigned: boolean
  rosterUploaded: boolean
  rosterHasValidClient: boolean
  inviteTokensReady: boolean
  emailTemplateConfigured: boolean
  registrationDatesValid: boolean
}

export type ReadinessReport = {
  ready: boolean
  checks: ReadinessChecks
}

export type EventOffering = {
  id: string
  eventId: string
  offeringId: string
  offering: Offering
}

export type AssignedOffering = {
  id: string
  offering: Offering
}
