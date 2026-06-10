export type EligibilityReason =
  | "INVALID_TOKEN"
  | "REGISTRATION_NOT_STARTED"
  | "REGISTRATION_CLOSED"
  | "EVENT_PAUSED"
  | "CAPACITY_REACHED"
  | "ALREADY_CONFIRMED"

export type EventContext = {
  id: string
  name: string
  status: string
  eventStartDate: string
  eventEndDate: string
  registrationStartDate: string
  registrationEndDate: string
  capacity: number
  isMultiDay: boolean
  availableAttendanceDates: string[]
}

export type ClientContext = {
  id: string
  name: string
  email: string
  company: string | null
}

export type ConfirmationContext = {
  confirmed: boolean
  confirmedAt: string | null
}

export type TokenResolution = {
  event: EventContext
  client: ClientContext
  confirmation: ConfirmationContext
  hasDraft: boolean
  eligible: boolean
  reason: EligibilityReason | null
}

export type ClientOffering = {
  id: string
  name: string
  description: string | null
  basePrice: string
}

export type ClientOfferingWithType = ClientOffering & {
  type: "product" | "service"
}

export type GroupedOfferings = {
  products: ClientOffering[]
  services: ClientOffering[]
}

export type FlowDraftData = {
  firstName?: string
  lastName?: string
  email?: string
  attendanceDate?: string
  productIds?: string[]
  serviceIds?: string[]
}

export type DraftView = {
  data: FlowDraftData
  updatedAt: string | null
}

export type ReservationView = {
  id: string
  eventId: string
  invitationId: string
  status: string
  expiresAt: string
}

export type ConfirmInput = {
  firstName: string
  lastName: string
  email: string
  attendanceDate: string
  offeringIds: string[]
}

export type ConfirmationInterest = {
  offeringId: string
  name: string
}

export type ConfirmationResult = {
  message: string
  confirmationId: string
  confirmedAt: string
  attendanceDate: string
  event: {
    id: string
    name: string
    eventStartDate: string
    eventEndDate: string
  }
  interests: {
    products: ConfirmationInterest[]
    services: ConfirmationInterest[]
  }
}
