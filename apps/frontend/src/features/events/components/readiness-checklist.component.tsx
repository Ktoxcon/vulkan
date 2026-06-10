import { useTranslation } from "react-i18next"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readinessCheckOrder } from "@/features/events/constants/event.constants"
import { useEventReadiness } from "@/features/events/hooks/event-readiness.hook"
import { cn } from "@/lib/css/classes"

type ReadinessChecklistProps = { eventId: string }

export function ReadinessChecklist({ eventId }: ReadinessChecklistProps) {
  const { t } = useTranslation("events")
  const { readiness, isLoading, isError } = useEventReadiness(eventId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
      </div>
    )
  }

  if (isError || !readiness) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {t("readiness.loadError")}
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {readiness.ready ? (
            <CheckCircle2 className="size-5 text-primary" aria-hidden />
          ) : (
            <XCircle className="size-5 text-destructive" aria-hidden />
          )}
          {readiness.ready ? t("readiness.ready") : t("readiness.notReady")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {readinessCheckOrder.map((key) => {
            const passed = readiness.checks[key]
            return (
              <li key={key} className="flex items-center gap-3 text-sm">
                {passed ? (
                  <CheckCircle2
                    className="size-5 shrink-0 text-primary"
                    aria-label={t("readiness.passed")}
                  />
                ) : (
                  <XCircle
                    className="size-5 shrink-0 text-destructive"
                    aria-label={t("readiness.failed")}
                  />
                )}
                <span
                  className={cn(
                    passed ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(`readiness.checks.${key}`)}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
