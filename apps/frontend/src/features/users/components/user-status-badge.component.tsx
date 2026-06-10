import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { userStatusBadge } from "@/features/users/constants/user.constants"
import type { UserStatus } from "@/features/users/types/user.types"

type UserStatusBadgeProps = {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { t } = useTranslation("users")
  const { variant, label } = userStatusBadge[status]

  return <Badge variant={variant}>{t(label)}</Badge>
}
