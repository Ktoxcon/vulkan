import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { UserForm } from "@/features/users/components/user-form.component"
import { useCreateUser } from "@/features/users/hooks/create-user.hook"
import type { CreateUserInput } from "@/features/users/types/user.types"

export function UserCreatePage() {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const createUser = useCreateUser()

  const onSubmit = (values: CreateUserInput) => {
    createUser.mutate(values, {
      onSuccess: (user) => {
        toast.success(t("toast.created", { name: user.name, lastName: user.lastName }))
        navigate("/users")
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
          <Link to="/users">
            <ArrowLeft />
            {t("actions.backToUsers")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          {t("create.title")}
        </h1>
      </div>
      <UserForm
        mode="create"
        onSubmit={onSubmit}
        pending={createUser.isPending}
        error={createUser.error}
      />
    </div>
  )
}
