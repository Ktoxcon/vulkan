import { request } from "@/lib/clients/http.client"
import type {
  EmailTemplate,
  EmailTemplateInput,
  EmailTemplatePreview,
} from "@/features/email-templates/types/email-template.types"

async function get(eventId: string): Promise<EmailTemplate> {
  return request<EmailTemplate>(`/events/${eventId}/email-template`)
}

async function create(eventId: string, input: EmailTemplateInput): Promise<EmailTemplate> {
  return request<EmailTemplate>(`/events/${eventId}/email-template`, {
    method: "POST",
    body: input,
  })
}

async function update(eventId: string, input: EmailTemplateInput): Promise<EmailTemplate> {
  return request<EmailTemplate>(`/events/${eventId}/email-template`, {
    method: "PATCH",
    body: input,
  })
}

async function preview(eventId: string): Promise<EmailTemplatePreview> {
  return request<EmailTemplatePreview>(`/events/${eventId}/email-template/preview`)
}

export const EmailTemplateClient = { get, create, update, preview }
