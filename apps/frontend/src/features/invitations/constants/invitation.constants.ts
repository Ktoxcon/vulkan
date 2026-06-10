import type {
  InvitationMonitoring,
  InvitationStatus as InvitationStatusType,
} from "@/features/invitations/types/invitation.types"

export const INVITATION_STATUS_ALL = "all"

export const monitoringCounters: {
  key: keyof InvitationMonitoring
  labelKey: string
}[] = [
  { key: "total", labelKey: "monitoring.total" },
  { key: "pending", labelKey: "monitoring.pending" },
  { key: "queued", labelKey: "monitoring.queued" },
  { key: "processing", labelKey: "monitoring.processing" },
  { key: "sent", labelKey: "monitoring.sent" },
  { key: "opened", labelKey: "monitoring.opened" },
  { key: "failed", labelKey: "monitoring.failed" },
  { key: "confirmed", labelKey: "monitoring.confirmed" },
]

export const invitationsQueryKey = ["invitations"] as const

export const dispatchQueryKey = ["invitation-dispatch"] as const

export const InvitationStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  OPENED: "opened",
  FAILED: "failed",
  STARTED: "started",
  CONFIRMED: "confirmed",
  EXPIRED: "expired",
} as const satisfies Record<string, InvitationStatusType>

export const statusLabelKeys = {
  pending: "status.pending",
  queued: "status.queued",
  processing: "status.processing",
  sent: "status.sent",
  opened: "status.opened",
  failed: "status.failed",
  started: "status.started",
  confirmed: "status.confirmed",
  expired: "status.expired",
} as const satisfies Record<InvitationStatusType, string>

export const statusBadgeVariants = {
  pending: "outline",
  queued: "secondary",
  processing: "secondary",
  sent: "default",
  opened: "default",
  failed: "destructive",
  started: "secondary",
  confirmed: "default",
  expired: "outline",
} as const satisfies Record<
  InvitationStatusType,
  "default" | "secondary" | "outline" | "destructive"
>
