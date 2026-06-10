import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { UserForm } from "@/features/users/components/user-form.component"
import { useUser } from "@/features/users/hooks/user.hook"
import { useUpdateUser } from "@/features/users/hooks/update-user.hook"
import { useAuth } from "@/features/auth/hooks/auth.hook"
import type { UpdateUserInput } from "@/features/users/types/user.types"

export function UserEditPage() {
  const { t } = useTranslation("users")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isLoading, isError } = useUser(id)
  const { user: currentUser } = useAuth()
  const updateUser = useUpdateUser()

  const onSubmit = (patch: UpdateUserInput) => {
    if (!id) return
    updateUser.mutate(
      { id, patch },
      {
        onSuccess: (updated) => {
          toast.success(t("toast.updated", { name: updated.name, lastName: updated.lastName }))
          navigate("/users")
        },
      }
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
          <Link to="/users">
            <ArrowLeft />
            {t("actions.backToUsers")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          {t("edit.title")}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label={t("edit.loading")} />
        </div>
      ) : isError || !user ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm font-medium text-destructive">
            {t("edit.notFound")}
          </p>
          <Button asChild variant="outline" className="h-11 md:h-9">
            <Link to="/users">{t("actions.backToUsers")}</Link>
          </Button>
        </div>
      ) : (
        <UserForm
          mode="edit"
          user={user}
          onSubmit={onSubmit}
          pending={updateUser.isPending}
          error={updateUser.error}
          lockRole={currentUser?.id === user.id}
        />
      )}
    </div>
  )
}
