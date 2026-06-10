import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RosterUpload } from "@/features/roster/components/roster-upload.component"
import { RosterImportPreview } from "@/features/roster/components/roster-import-preview.component"
import { RosterView } from "@/features/roster/components/roster-view.component"
import { AddRosterClientDialog } from "@/features/roster/components/add-roster-client-dialog.component"
import { useRoster } from "@/features/roster/hooks/roster.hook"
import type { ImportRecord } from "@/features/roster/types/roster.types"
import type { EventStatus } from "@/features/events/types/event.types"

type RosterTabProps = {
  eventId: string
  eventStatus: EventStatus
}

export function RosterTab({ eventId, eventStatus }: RosterTabProps) {
  const { t } = useTranslation("roster")
  const [preview, setPreview] = useState<ImportRecord | null>(null)
  const [reimporting, setReimporting] = useState(false)
  const { hasRoster, clients, isLoading, isError } = useRoster(eventId)

  const isDraft = eventStatus === "draft"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-label={t("tab.loading")}
        />
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

  if (preview) {
    return (
      <RosterImportPreview
        eventId={eventId}
        record={preview}
        onCancel={() => {
          setPreview(null)
          setReimporting(false)
        }}
        onConfirmed={() => {
          setPreview(null)
          setReimporting(false)
        }}
      />
    )
  }

  if (hasRoster && !reimporting) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <RosterView clients={clients} />
          {isDraft ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AddRosterClientDialog eventId={eventId} />
              <Button
                variant="outline"
                className="h-11 w-full shrink-0 sm:w-auto md:h-9"
                onClick={() => setReimporting(true)}
              >
                {t("tab.reimport")}
              </Button>
            </div>
          ) : null}
        </div>
        {!isDraft ? (
          <p className="text-sm text-muted-foreground">{t("tab.locked")}</p>
        ) : null}
      </div>
    )
  }

  if (!isDraft) {
    return (
      <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
        {t("tab.emptyLocked")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reimporting ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-fit px-2 md:h-9"
          onClick={() => setReimporting(false)}
        >
          {t("tab.cancelReimport")}
        </Button>
      ) : null}
      <RosterUpload eventId={eventId} onImported={setPreview} />
      {!reimporting ? (
        <div className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t("tab.addOneAtATime")}
          </p>
          <AddRosterClientDialog eventId={eventId} />
        </div>
      ) : null}
    </div>
  )
}
