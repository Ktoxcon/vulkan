import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { PortfolioTransitions } from "@/features/portfolios/constants/portfolio.constants"
import { useUpdatePortfolioStatus } from "@/features/portfolios/hooks/portfolio-status.hook"
import type {
  PortfolioDetail,
  PortfolioStatus,
} from "@/features/portfolios/types/portfolio.types"
import { ApiError } from "@/lib/errors/api.error"

type PortfolioStatusActionsProps = {
  portfolio: PortfolioDetail
}

export function PortfolioStatusActions({
  portfolio,
}: PortfolioStatusActionsProps) {
  const { t } = useTranslation("portfolios")
  const [target, setTarget] = useState<PortfolioStatus | null>(null)
  const updateStatus = useUpdatePortfolioStatus(portfolio.id)
  const nextStates = PortfolioTransitions[portfolio.status]

  const confirm = () => {
    if (!target) return
    updateStatus.mutate(target, {
      onSuccess: (updated) => {
        toast.success(
          t("toast.statusUpdated", { status: t(`status.${updated.status}`) })
        )
        setTarget(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : t("toast.statusUpdateFailed")
        )
        setTarget(null)
      },
    })
  }

  if (nextStates.length === 0) return null

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {nextStates.map((status) => (
          <Button
            key={status}
            variant={status === "rejected" ? "destructive" : "default"}
            className="h-11 w-full sm:w-auto"
            onClick={() => setTarget(status)}
          >
            {t(`transitionAction.${status}`)}
          </Button>
        ))}
      </div>

      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !updateStatus.isPending) setTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {target ? t(`transitionAction.${target}`) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target
                ? t("statusActions.dialogDescription", {
                    status: t(`status.${target}`),
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatus.isPending}>
              {t("statusActions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={updateStatus.isPending}
              onClick={(event) => {
                event.preventDefault()
                confirm()
              }}
            >
              {updateStatus.isPending ? (
                <Loader2 className="animate-spin" />
              ) : null}
              {t("statusActions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
