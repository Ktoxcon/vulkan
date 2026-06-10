import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEmailTemplatePreview } from "@/features/email-templates/hooks/email-template-preview.hook"

type EmailTemplatePreviewProps = {
  eventId: string
  enabled: boolean
}

export function EmailTemplatePreview({
  eventId,
  enabled,
}: EmailTemplatePreviewProps) {
  const { t } = useTranslation("email-templates")
  const { preview, isLoading, isError } = useEmailTemplatePreview(eventId, enabled)

  if (!enabled) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("preview.loading")} />
      </div>
    )
  }

  if (isError || !preview) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {t("preview.error")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("preview.subject.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{preview.subject}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("preview.htmlBody.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: preview.htmlBody }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("preview.textBody.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
            {preview.textBody}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
