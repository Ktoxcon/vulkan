import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Pencil, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSetUserStatus } from "@/features/users/hooks/user-status.hook"
import type { User } from "@/features/users/types/user.types"
import { resolveError } from "@/lib/errors/resolve-error"

type UserRowActionsProps = {
  user: User
  isSelf: boolean
}

export function UserRowActions({ user, isSelf }: UserRowActionsProps) {
  const { t } = useTranslation("users")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const setStatus = useSetUserStatus()
  const isInactive = user.status === "INACTIVE"

  const reactivate = () => {
    setStatus.mutate(
      { id: user.id, status: "ACTIVE" },
      {
        onSuccess: () =>
          toast.success(t("toast.reactivated", { name: user.name })),
        onError: (error) => toast.error(resolveError(error)),
      }
    )
  }

  const deactivate = () => {
    setStatus.mutate(
      { id: user.id, status: "INACTIVE" },
      {
        onSuccess: () => {
          toast.success(t("toast.deactivated", { name: user.name }))
          setConfirmOpen(false)
        },
        onError: (error) => toast.error(resolveError(error)),
      }
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" className="h-11 md:h-9">
        <Link to={`/users/${user.id}`}>
          <Pencil />
          {t("actions.edit")}
        </Link>
      </Button>
      {isInactive ? (
        <Button
          variant="outline"
          size="sm"
          className="h-11 md:h-9"
          onClick={reactivate}
          disabled={setStatus.isPending}
        >
          <Power />
          {t("actions.reactivate")}
        </Button>
      ) : (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Button
            variant="outline"
            size="sm"
            className="h-11 md:h-9"
            onClick={() => setConfirmOpen(true)}
            disabled={isSelf}
            title={
              isSelf
                ? t("actions.deactivateSelfTitle")
                : undefined
            }
          >
            <PowerOff />
            {t("actions.deactivate")}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deactivateDialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deactivateDialog.description", {
                  name: user.name,
                  lastName: user.lastName,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={setStatus.isPending}>
                {t("deactivateDialog.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault()
                  deactivate()
                }}
                disabled={setStatus.isPending}
              >
                {t("deactivateDialog.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
