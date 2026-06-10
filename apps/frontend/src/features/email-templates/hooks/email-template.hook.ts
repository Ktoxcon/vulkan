import { useQuery } from "@tanstack/react-query"
import { EmailTemplateClient } from "@/lib/clients/email-template.client"
import { emailTemplateQueryKey } from "@/features/email-templates/constants/email-template.constants"
import type { EmailTemplate } from "@/features/email-templates/types/email-template.types"
import { ApiError } from "@/lib/errors/api.error"

export function useEmailTemplate(eventId: string | undefined) {
  const query = useQuery<EmailTemplate | null>({
    queryKey: [...emailTemplateQueryKey, eventId],
    queryFn: async () => {
      try {
        return await EmailTemplateClient.get(eventId as string)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    enabled: Boolean(eventId),
    retry: false,
  })

  return {
    template: query.data ?? null,
    hasTemplate: query.data !== null && query.data !== undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
