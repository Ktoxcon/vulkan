import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EventForm } from "@/features/events/components/event-form.component"
import { useEvent } from "@/features/events/hooks/event.hook"
import { useUpdateEvent } from "@/features/events/hooks/update-event.hook"
import type { UpdateEventInput } from "@/features/events/types/event.types"
import { Routes } from "@/lib/constants/routes.constants"

export function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation("events")
  const { event, isLoading, isError } = useEvent(eventId)
  const updateEvent = useUpdateEvent()

  const onSubmit = (fields: UpdateEventInput) => {
    if (!eventId) return
    updateEvent.mutate(
      { id: eventId, fields },
      {
        onSuccess: (updated) => {
          toast.success(t("toast.updated", { name: updated.name }))
          navigate(`/events/${eventId}`)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm font-medium text-destructive">{t("edit.notFound")}</p>
        <Button asChild variant="outline" className="h-11 md:h-9">
          <Link to={Routes.events}>{t("detail.back")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-11 w-fit px-2 md:h-9"
        >
          <Link to={`/events/${event.id}`}>
            <ArrowLeft />
            {t("edit.back")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          {t("edit.title", { name: event.name })}
        </h1>
      </div>
      <EventForm
        mode="edit"
        event={event}
        onSubmit={onSubmit}
        pending={updateEvent.isPending}
        error={updateEvent.error}
      />
    </div>
  )
}
