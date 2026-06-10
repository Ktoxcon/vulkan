import { CreateEventForm } from "@/features/events/components/create-event-form.component"
import { EditEventForm } from "@/features/events/components/edit-event-form.component"
import type {
  CreateEventInput,
  SalesEvent,
  UpdateEventInput,
} from "@/features/events/types/event.types"

type EventFormProps =
  | {
      mode: "create"
      onSubmit: (values: CreateEventInput) => void
      pending: boolean
      error?: unknown
    }
  | {
      mode: "edit"
      event: SalesEvent
      onSubmit: (values: UpdateEventInput) => void
      pending: boolean
      error?: unknown
    }

export function EventForm(props: EventFormProps) {
  if (props.mode === "create") {
    return (
      <CreateEventForm
        onSubmit={props.onSubmit}
        pending={props.pending}
        error={props.error}
      />
    )
  }

  return (
    <EditEventForm
      event={props.event}
      onSubmit={props.onSubmit}
      pending={props.pending}
      error={props.error}
    />
  )
}
