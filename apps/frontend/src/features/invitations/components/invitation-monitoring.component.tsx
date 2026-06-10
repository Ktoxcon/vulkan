import { useTranslation } from "react-i18next"
import type { InvitationMonitoring as InvitationMonitoringData } from "@/features/invitations/types/invitation.types"
import { monitoringCounters } from "@/features/invitations/constants/invitation.constants"

type InvitationMonitoringProps = {
  monitoring: InvitationMonitoringData
}

export function InvitationMonitoring({ monitoring }: InvitationMonitoringProps) {
  const { t } = useTranslation("invitations")

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {monitoringCounters.map((counter) => (
        <div key={counter.key} className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">{t(counter.labelKey)}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {monitoring[counter.key]}
          </p>
        </div>
      ))}
    </div>
  )
}
