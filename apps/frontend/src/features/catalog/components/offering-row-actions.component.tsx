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
import {
  useDeactivateOffering,
  useReactivateOffering,
} from "@/features/catalog/hooks/offering-status.hook"
import type { Offering } from "@/features/catalog/types/offering.types"
import { resolveError } from "@/lib/errors/resolve-error"

type OfferingRowActionsProps = {
  offering: Offering
}

export function OfferingRowActions({ offering }: OfferingRowActionsProps) {
  const { t } = useTranslation("catalog")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deactivate = useDeactivateOffering()
  const reactivate = useReactivateOffering()
  const pending = deactivate.isPending || reactivate.isPending

  const onReactivate = () => {
    reactivate.mutate(offering.id, {
      onSuccess: () => toast.success(t("toast.reactivated", { name: offering.name })),
      onError: (error) => toast.error(resolveError(error)),
    })
  }

  const onDeactivate = () => {
    deactivate.mutate(offering.id, {
      onSuccess: () => {
        toast.success(t("toast.deactivated", { name: offering.name }))
        setConfirmOpen(false)
      },
      onError: (error) => toast.error(resolveError(error)),
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" className="h-11 md:h-9">
        <Link to={`/catalog/${offering.id}`}>
          <Pencil />
          {t("actions.edit")}
        </Link>
      </Button>
      {offering.isActive ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Button
            variant="outline"
            size="sm"
            className="h-11 md:h-9"
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
          >
            <PowerOff />
            {t("actions.deactivate")}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("rowActions.deactivateTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("rowActions.deactivateDescription", { name: offering.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>{t("rowActions.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault()
                  onDeactivate()
                }}
                disabled={pending}
              >
                {t("actions.deactivate")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-11 md:h-9"
          onClick={onReactivate}
          disabled={pending}
        >
          <Power />
          {t("actions.reactivate")}
        </Button>
      )}
    </div>
  )
}
