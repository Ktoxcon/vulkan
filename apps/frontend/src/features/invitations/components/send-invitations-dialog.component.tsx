import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useDispatchInvitations } from "@/features/invitations/hooks/dispatch-invitations.hook"
import { useDispatchProgress } from "@/features/invitations/hooks/dispatch-progress.hook"
import { ApiError } from "@/lib/errors/api.error"
import { resolveError } from "@/lib/errors/resolve-error"

type SendInvitationsDialogProps = {
  eventId: string
  pendingCount: number
}

export function SendInvitationsDialog({
  eventId,
  pendingCount,
}: SendInvitationsDialogProps) {
  const { t } = useTranslation("invitations")
  const [open, setOpen] = useState(false)
  const [dispatchId, setDispatchId] = useState<string | null>(null)
  const dispatch = useDispatchInvitations(eventId)
  const { progress } = useDispatchProgress(eventId, dispatchId)

  const done =
    progress !== null &&
    progress.pending + progress.queued + progress.processing === 0
  const percent = progress && progress.total > 0
    ? Math.round(((progress.total - progress.pending - progress.queued - progress.processing) / progress.total) * 100)
    : 0

  const send = () => {
    dispatch.mutate(undefined, {
      onSuccess: (result) => {
        setDispatchId(result.dispatchId)
        toast.success(t("send.toast.queued", { count: result.queuedCount }))
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.code === "DISPATCH_TEMPLATE_MISSING") {
            toast.error(t("send.toast.templateMissing"))
            return
          }
          if (error.code === "DISPATCH_NO_PENDING_INVITATIONS") {
            toast.error(t("send.toast.noPending"))
            return
          }
        }
        toast.error(resolveError(error))
      },
    })
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setDispatchId(null)
  }

  return (
    <>
      <Button
        className="h-11 w-full sm:w-auto"
        onClick={() => onOpenChange(true)}
        disabled={pendingCount === 0}
      >
        <Send />
        {t("send.action")}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("send.title")}</DialogTitle>
            <DialogDescription>
              {dispatchId
                ? t("send.description.running")
                : t("send.description.queue", { count: pendingCount })}
            </DialogDescription>
          </DialogHeader>

          {dispatchId && progress ? (
            <div className="flex flex-col gap-3">
              <Progress value={percent} />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">{t("send.progress.sent")}</p>
                  <p className="font-semibold">{progress.sent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("send.progress.inProgress")}</p>
                  <p className="font-semibold">
                    {progress.queued + progress.processing}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("send.progress.failed")}</p>
                  <p className="font-semibold text-destructive">{progress.failed}</p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-end">
            {dispatchId ? (
              <Button
                className="h-11 w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                {done ? t("send.done") : t("send.close")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="h-11 w-full sm:w-auto"
                  onClick={() => onOpenChange(false)}
                  disabled={dispatch.isPending}
                >
                  {t("send.cancel")}
                </Button>
                <Button
                  className="h-11 w-full sm:w-auto"
                  onClick={send}
                  disabled={dispatch.isPending}
                >
                  {dispatch.isPending && <Loader2 className="animate-spin" />}
                  {t("send.confirm")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
