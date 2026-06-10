import { http, HttpResponse } from "msw"
import type {
  EmailTemplate,
  EmailTemplatePreview,
} from "@/features/email-templates/types/email-template.types"
import { apiUrl } from "./handlers"

export function makeEmailTemplate(
  overrides: Partial<EmailTemplate> = {},
): EmailTemplate {
  return {
    id: "tpl-1",
    eventId: "e-1",
    name: "Forge Invite",
    subject: "You are invited, {{clientName}}",
    htmlBody: "<p>Hello {{clientName}} from {{companyName}}</p>",
    textBody: "Hello {{clientName}} from {{companyName}}",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeEmailTemplatePreview(
  overrides: Partial<EmailTemplatePreview> = {},
): EmailTemplatePreview {
  return {
    subject: "You are invited, Raphen",
    htmlBody: "<p>Hello Raphen from Forge Co</p>",
    textBody: "Hello Raphen from Forge Co",
    variables: {
      clientName: "Raphen",
      companyName: "Forge Co",
      eventName: "Annual Forge Expo",
      eventDate: "2026-09-01",
      invitationUrl: "https://vulkan.test/invite/abc",
    },
    ...overrides,
  }
}

export const getEmailTemplate = (template: EmailTemplate = makeEmailTemplate()) =>
  http.get(apiUrl("/events/:eventId/email-template"), () =>
    HttpResponse.json({ success: true, data: template }),
  )

export const getEmailTemplateNotFound = () =>
  http.get(apiUrl("/events/:eventId/email-template"), () =>
    HttpResponse.json(
      {
        success: false,
        code: "EMAIL_TEMPLATE_NOT_FOUND",
        message: "No template yet.",
      },
      { status: 404 },
    ),
  )

export const createEmailTemplate = (
  capture?: { body?: Record<string, unknown>; calls?: number },
  template: EmailTemplate = makeEmailTemplate(),
) =>
  http.post(apiUrl("/events/:eventId/email-template"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (capture) {
      capture.body = body
      capture.calls = (capture.calls ?? 0) + 1
    }
    return HttpResponse.json({ success: true, data: template }, { status: 201 })
  })

export const createEmailTemplateError = (
  code = "EMAIL_TEMPLATE_ALREADY_EXISTS",
  message = "A template already exists for this event.",
  status = 409,
) =>
  http.post(apiUrl("/events/:eventId/email-template"), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  )

export const updateEmailTemplate = (
  capture?: { body?: Record<string, unknown>; calls?: number },
  template: EmailTemplate = makeEmailTemplate(),
) =>
  http.patch(apiUrl("/events/:eventId/email-template"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (capture) {
      capture.body = body
      capture.calls = (capture.calls ?? 0) + 1
    }
    return HttpResponse.json({
      success: true,
      data: { ...template, ...body },
    })
  })

export const getEmailTemplatePreview = (
  preview: EmailTemplatePreview = makeEmailTemplatePreview(),
) =>
  http.get(apiUrl("/events/:eventId/email-template/preview"), () =>
    HttpResponse.json({ success: true, data: preview }),
  )
