import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Pause, Play, Rocket, Square } from "lucide-react"
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
import { useEventTransition } from "@/features/events/hooks/event-transition.hook"
import {
  EventStatus,
  EventTransitions,
} from "@/features/events/constants/event.constants"
import type {
  EventStatus as EventStatusType,
  ReadinessChecks,
  SalesEvent,
} from "@/features/events/types/event.types"
import { ApiError } from "@/lib/errors/api.error"
import { resolveError } from "@/lib/errors/resolve-error"

type EventLifecycleActionsProps = {
  event: SalesEvent
  onNotReady?: () => void
}

export function EventLifecycleActions({
  event,
  onNotReady,
}: EventLifecycleActionsProps) {
  const { t } = useTranslation("events")
  const [confirmClose, setConfirmClose] = useState(false)
  const transition = useEventTransition()
  const allowed: readonly EventStatusType[] = EventTransitions[event.status]

  const failingChecks = (details: unknown): string[] => {
    if (!details || typeof details !== "object") return []
    const checks = (details as { checks?: Partial<ReadinessChecks> }).checks
    if (!checks || typeof checks !== "object") return []
    return Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => t(`readiness.checks.${key as keyof ReadinessChecks}`))
  }

  const run = (status: EventStatusType, successMessage: string) => {
    transition.mutate(
      { id: event.id, status },
      {
        onSuccess: () => toast.success(successMessage),
        onError: (error) => {
          if (
            error instanceof ApiError &&
            error.code === "EVENT_NOT_READY"
          ) {
            const failing = failingChecks(error.details)
            toast.error(
              failing.length
                ? t("toast.notReadyWithChecks", { checks: failing.join(", ") })
                : t("toast.notReady")
            )
            onNotReady?.()
            return
          }
          toast.error(resolveError(error))
        },
      }
    )
  }

  const confirmCloseEvent = () => {
    transition.mutate(
      { id: event.id, status: EventStatus.CLOSED },
      {
        onSuccess: () => {
          toast.success(t("toast.closed"))
          setConfirmClose(false)
        },
        onError: (error) => toast.error(resolveError(error)),
      }
    )
  }

  if (allowed.length === 0) {
    return null
  }

  return (
    <>
      {allowed.includes(EventStatus.ACTIVE) &&
        event.status === EventStatus.DRAFT && (
          <Button
            className="h-11 w-full sm:w-auto"
            onClick={() => run(EventStatus.ACTIVE, t("toast.launched"))}
            disabled={transition.isPending}
          >
            {transition.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Rocket />
            )}
            {t("actions.launch")}
          </Button>
        )}
      {allowed.includes(EventStatus.ACTIVE) &&
        event.status === EventStatus.PAUSED && (
          <Button
            className="h-11 w-full sm:w-auto"
            onClick={() => run(EventStatus.ACTIVE, t("toast.resumed"))}
            disabled={transition.isPending}
          >
            {transition.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play />
            )}
            {t("actions.resume")}
          </Button>
        )}
      {allowed.includes(EventStatus.PAUSED) && (
        <Button
          variant="outline"
          className="h-11 w-full sm:w-auto"
          onClick={() => run(EventStatus.PAUSED, t("toast.paused"))}
          disabled={transition.isPending}
        >
          <Pause />
          {t("actions.pause")}
        </Button>
      )}
      {allowed.includes(EventStatus.CLOSED) && (
        <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
          <Button
            variant="destructive"
            className="h-11 w-full sm:w-auto"
            onClick={() => setConfirmClose(true)}
            disabled={transition.isPending}
          >
            <Square />
            {t("actions.close")}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("actions.confirmClose.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("actions.confirmClose.description", { name: event.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={transition.isPending}>
                {t("actions.confirmClose.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(domEvent) => {
                  domEvent.preventDefault()
                  confirmCloseEvent()
                }}
                disabled={transition.isPending}
              >
                {t("actions.confirmClose.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
