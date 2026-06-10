import { useQuery } from "@tanstack/react-query"
import { EmailTemplateClient } from "@/lib/clients/email-template.client"
import { emailTemplateQueryKey } from "@/features/email-templates/constants/email-template.constants"
import type { EmailTemplatePreview } from "@/features/email-templates/types/email-template.types"

export function useEmailTemplatePreview(eventId: string | undefined, enabled = true) {
  const query = useQuery<EmailTemplatePreview>({
    queryKey: [...emailTemplateQueryKey, eventId, "preview"],
    queryFn: () => EmailTemplateClient.preview(eventId as string),
    enabled: Boolean(eventId) && enabled,
  })

  return {
    preview: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
