import { CreateUserForm } from "@/features/users/components/create-user-form.component"
import { EditUserForm } from "@/features/users/components/edit-user-form.component"
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
} from "@/features/users/types/user.types"

type UserFormProps =
  | {
      mode: "create"
      onSubmit: (values: CreateUserInput) => void
      pending: boolean
      error?: unknown
    }
  | {
      mode: "edit"
      user: User
      onSubmit: (values: UpdateUserInput) => void
      pending: boolean
      error?: unknown
      lockRole?: boolean
    }

export function UserForm(props: UserFormProps) {
  if (props.mode === "create") {
    return (
      <CreateUserForm
        onSubmit={props.onSubmit}
        pending={props.pending}
        error={props.error}
      />
    )
  }

  return (
    <EditUserForm
      user={props.user}
      onSubmit={props.onSubmit}
      pending={props.pending}
      error={props.error}
      lockRole={props.lockRole}
    />
  )
}
