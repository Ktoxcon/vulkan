import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { eventStatusVariant } from "@/features/events/constants/event.constants"
import type { EventStatus } from "@/features/events/types/event.types"

type EventStatusBadgeProps = { status: EventStatus }

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const { t } = useTranslation("events")

  return (
    <Badge variant={eventStatusVariant[status]}>{t(`status.${status}`)}</Badge>
  )
}
