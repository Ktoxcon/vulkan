import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import {
  statusBadgeVariants,
  statusLabelKeys,
} from "@/features/invitations/constants/invitation.constants"
import type { InvitationStatus } from "@/features/invitations/types/invitation.types"

type InvitationStatusBadgeProps = {
  status: InvitationStatus
}

export function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  const { t } = useTranslation("invitations")

  return <Badge variant={statusBadgeVariants[status]}>{t(statusLabelKeys[status])}</Badge>
}
