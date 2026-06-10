import {
  formatCountdown,
  remainingMsUntil,
} from "@/features/invitation-flow/lib/countdown"
import { COUNTDOWN_TICK_MS } from "@/features/invitation-flow/constants/countdown.constants"
import type { EventContext } from "@/features/invitation-flow/types/invitation-flow.types"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

type InvitationEventContextProps = {
  event: EventContext
}

export function InvitationEventContext({ event }: InvitationEventContextProps) {
  const { t } = useTranslation("invitation-flow")
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, COUNTDOWN_TICK_MS)
    return () => window.clearInterval(interval)
  }, [])

  const remainingMs = remainingMsUntil(event.eventStartDate, nowMs)
  const hasStarted = remainingMs <= 0

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:text-base">
        {event.name}
      </span>
      {hasStarted ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
          {t("navbar.eventStarted")}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm">
          <span>{t("navbar.remaining")}</span>
          <span
            aria-label={t("navbar.countdownLabel")}
            className="font-medium tabular-nums text-foreground"
          >
            {formatCountdown(remainingMs)}
          </span>
        </span>
      )}
    </div>
  )
}
