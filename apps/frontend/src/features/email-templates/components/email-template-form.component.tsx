import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  emailTemplateSchema,
  type EmailTemplateFormValues,
} from "@/features/email-templates/schemas/email-template.schema"
import { EmailTemplateVariableHints } from "@/features/email-templates/components/email-template-variable-hints.component"
import { useSaveEmailTemplate } from "@/features/email-templates/hooks/save-email-template.hook"
import type { EmailTemplate } from "@/features/email-templates/types/email-template.types"
import { ApiError } from "@/lib/errors/api.error"
import { resolveError } from "@/lib/errors/resolve-error"

type EmailTemplateFormProps = {
  eventId: string
  template: EmailTemplate | null
  disabled: boolean
  disabledHint?: string
}

export function EmailTemplateForm({
  eventId,
  template,
  disabled,
  disabledHint,
}: EmailTemplateFormProps) {
  const { t } = useTranslation("email-templates")
  const save = useSaveEmailTemplate(eventId)

  const resolveSaveError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.code === "EMAIL_TEMPLATE_ALREADY_EXISTS") {
        return t("error.alreadyExists")
      }
      if (error.code === "EMAIL_TEMPLATE_LOCKED") {
        return t("error.locked")
      }
    }
    return resolveError(error)
  }

  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      htmlBody: template?.htmlBody ?? "",
      textBody: template?.textBody ?? "",
    },
  })

  const handleSubmit = (values: EmailTemplateFormValues) => {
    save.mutate(
      { input: values, exists: template !== null },
      {
        onSuccess: () => toast.success(t("toast.saved")),
        onError: (error) => toast.error(resolveSaveError(error)),
      }
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        {disabled && disabledHint ? (
          <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
            {disabledHint}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("form.variables.label")}</p>
          <EmailTemplateVariableHints />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.name.label")}</FormLabel>
              <FormControl>
                <Input className="h-11" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.subject.label")}</FormLabel>
              <FormControl>
                <Input className="h-11" disabled={disabled} {...field} />
              </FormControl>
              <FormDescription>
                {t("form.subject.description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="htmlBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.htmlBody.label")}</FormLabel>
              <FormControl>
                <Textarea rows={8} disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="textBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.textBody.label")}</FormLabel>
              <FormControl>
                <Textarea rows={6} disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="h-11 w-full sm:w-auto"
          disabled={disabled || save.isPending}
        >
          {save.isPending && <Loader2 className="animate-spin" />}
          {template ? t("form.actions.save") : t("form.actions.create")}
        </Button>
      </form>
    </Form>
  )
}
