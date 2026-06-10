import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventLifecycleActions } from "@/features/events/components/event-lifecycle-actions.component"
import type { SalesEvent } from "@/features/events/types/event.types"

type EventHeaderActionsProps = {
  event: SalesEvent
  editHref: string
  onNotReady?: () => void
}

export function EventHeaderActions({
  event,
  editHref,
  onNotReady,
}: EventHeaderActionsProps) {
  const { t } = useTranslation("events")

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
      <EventLifecycleActions event={event} onNotReady={onNotReady} />
      <Button asChild className="h-11 w-full sm:w-auto">
        <Link to={editHref}>
          <Pencil />
          {t("actions.edit")}
        </Link>
      </Button>
    </div>
  )
}
