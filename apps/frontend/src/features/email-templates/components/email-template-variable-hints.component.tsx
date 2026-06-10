import { useTranslation } from "react-i18next"
import { TEMPLATE_VARIABLES } from "@/features/email-templates/constants/email-template.constants"

export function EmailTemplateVariableHints() {
  const { t } = useTranslation("email-templates")

  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATE_VARIABLES.map((variable) => (
        <span
          key={variable.token}
          className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
          title={t(variable.labelKey)}
        >
          {variable.token}
        </span>
      ))}
    </div>
  )
}
