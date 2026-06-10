import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EventForm } from "@/features/events/components/event-form.component"
import { useCreateEvent } from "@/features/events/hooks/create-event.hook"
import type { CreateEventInput } from "@/features/events/types/event.types"
import { Routes } from "@/lib/constants/routes.constants"

export function EventCreatePage() {
  const navigate = useNavigate()
  const { t } = useTranslation("events")
  const createEvent = useCreateEvent()

  const onSubmit = (values: CreateEventInput) => {
    createEvent.mutate(values, {
      onSuccess: (event) => {
        toast.success(t("toast.created", { name: event.name }))
        navigate(`/events/${event.id}`)
      },
    })
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
          <Link to={Routes.events}>
            <ArrowLeft />
            {t("create.back")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          {t("create.title")}
        </h1>
      </div>
      <EventForm
        mode="create"
        onSubmit={onSubmit}
        pending={createEvent.isPending}
        error={createEvent.error}
      />
    </div>
  )
}
