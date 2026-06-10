import { useMutation, useQueryClient } from "@tanstack/react-query"
import { EmailTemplateClient } from "@/lib/clients/email-template.client"
import { emailTemplateQueryKey } from "@/features/email-templates/constants/email-template.constants"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import type {
  EmailTemplate,
  EmailTemplateInput,
} from "@/features/email-templates/types/email-template.types"

export function useSaveEmailTemplate(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation<EmailTemplate, Error, { input: EmailTemplateInput; exists: boolean }>({
    mutationFn: ({ input, exists }) =>
      exists
        ? EmailTemplateClient.update(eventId, input)
        : EmailTemplateClient.create(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...emailTemplateQueryKey, eventId] })
      queryClient.invalidateQueries({
        queryKey: [...eventsQueryKey, "detail", eventId, "readiness"],
      })
    },
  })
}
