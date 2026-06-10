import { CreateOfferingForm } from "@/features/catalog/components/create-offering-form.component"
import { EditOfferingForm } from "@/features/catalog/components/edit-offering-form.component"
import type {
  CreateOfferingInput,
  Offering,
  UpdateOfferingInput,
} from "@/features/catalog/types/offering.types"

type OfferingFormProps =
  | {
      mode: "create"
      onSubmit: (values: CreateOfferingInput) => void
      pending: boolean
      error?: unknown
    }
  | {
      mode: "edit"
      offering: Offering
      onSubmit: (values: UpdateOfferingInput) => void
      pending: boolean
      error?: unknown
    }

export function OfferingForm(props: OfferingFormProps) {
  if (props.mode === "create") {
    return (
      <CreateOfferingForm
        onSubmit={props.onSubmit}
        pending={props.pending}
        error={props.error}
      />
    )
  }

  return (
    <EditOfferingForm
      offering={props.offering}
      onSubmit={props.onSubmit}
      pending={props.pending}
      error={props.error}
    />
  )
}
