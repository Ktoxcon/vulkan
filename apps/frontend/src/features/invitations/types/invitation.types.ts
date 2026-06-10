export type InvitationStatus =
  | "pending"
  | "queued"
  | "processing"
  | "sent"
  | "opened"
  | "failed"
  | "started"
  | "confirmed"
  | "expired"

export type Invitation = {
  id: string
  token: string
  status: InvitationStatus
  sentAt: string | null
  openedAt: string | null
  confirmedAt: string | null
}

export type InvitationClient = {
  id: string
  name: string
  email: string
  company: string | null
}

export type InvitationListItem = {
  invitation: Invitation
  client: InvitationClient
}

export type InvitationMonitoring = {
  total: number
  pending: number
  queued: number
  processing: number
  sent: number
  opened: number
  failed: number
  confirmed: number
}

export type InvitationListView = {
  invitations: InvitationListItem[]
  monitoring: InvitationMonitoring
}

export type GenerateResult = {
  created: Invitation[]
  createdCount: number
  totalRosterClients: number
  alreadyExistingCount: number
}

export type DispatchResult = {
  dispatchId: string
  queuedCount: number
  totalInvitations: number
  progress: DispatchProgress
}

export type DispatchProgress = {
  dispatchId: string
  total: number
  pending: number
  queued: number
  processing: number
  sent: number
  opened: number
  failed: number
  confirmed: number
}
