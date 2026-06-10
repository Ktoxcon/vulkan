import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmailTemplateForm } from "@/features/email-templates/components/email-template-form.component"
import { EmailTemplatePreview } from "@/features/email-templates/components/email-template-preview.component"
import { useEmailTemplate } from "@/features/email-templates/hooks/email-template.hook"
import type { EventStatus } from "@/features/events/types/event.types"

type EmailTemplateTabProps = {
  eventId: string
  eventStatus: EventStatus
}

export function EmailTemplateTab({
  eventId,
  eventStatus,
}: EmailTemplateTabProps) {
  const { t } = useTranslation("email-templates")
  const { template, hasTemplate, isLoading, isError } = useEmailTemplate(eventId)

  const isDraft = eventStatus === "draft"

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

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex-1">
        <EmailTemplateForm
          eventId={eventId}
          template={template}
          disabled={!isDraft}
          disabledHint={t("tab.lockedHint")}
        />
      </div>
      <div className="flex-1">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">{t("preview.title")}</h2>
        {hasTemplate ? (
          <EmailTemplatePreview eventId={eventId} enabled={hasTemplate} />
        ) : (
          <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
            {t("tab.empty")}
          </p>
        )}
      </div>
    </div>
  )
}
