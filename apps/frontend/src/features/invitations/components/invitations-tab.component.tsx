import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { GenerateInvitations } from "@/features/invitations/components/generate-invitations.component"
import { InvitationMonitoring } from "@/features/invitations/components/invitation-monitoring.component"
import { InvitationsTable } from "@/features/invitations/components/invitations-table.component"
import { SendInvitationsDialog } from "@/features/invitations/components/send-invitations-dialog.component"
import { useInvitations } from "@/features/invitations/hooks/invitations.hook"
import { InvitationsClient } from "@/lib/clients/invitations.client"
import type { InvitationStatus } from "@/features/invitations/types/invitation.types"
import { resolveError } from "@/lib/errors/resolve-error"

type InvitationsTabProps = {
  eventId: string
}

export function InvitationsTab({ eventId }: InvitationsTabProps) {
  const { t } = useTranslation("invitations")
  const [status, setStatus] = useState<InvitationStatus | undefined>(undefined)
  const [exporting, setExporting] = useState(false)
  const { invitations, monitoring, isLoading, isError } = useInvitations(eventId, {
    status,
  })

  const exportReport = async () => {
    setExporting(true)
    try {
      await InvitationsClient.downloadReport(eventId)
    } catch (error) {
      toast.error(resolveError(error))
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("tab.loading")} />
      </div>
    )
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {t("tab.error")}
      </p>
    )
  }

  const total = monitoring?.total ?? 0
  const pending = monitoring?.pending ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <GenerateInvitations eventId={eventId} />
        <SendInvitationsDialog eventId={eventId} pendingCount={pending} />
        <Button
          variant="outline"
          className="h-11 w-full sm:w-auto"
          onClick={exportReport}
          disabled={exporting || total === 0}
        >
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          {t("tab.export")}
        </Button>
      </div>

      {monitoring ? <InvitationMonitoring monitoring={monitoring} /> : null}

      <InvitationsTable
        invitations={invitations}
        status={status}
        onStatusChange={setStatus}
      />
    </div>
  )
}
