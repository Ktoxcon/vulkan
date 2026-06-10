export const emailTemplateQueryKey = ["email-template"] as const

export const TEMPLATE_VARIABLES = [
  { token: "{{clientName}}", labelKey: "email-templates:variables.clientName" },
  { token: "{{companyName}}", labelKey: "email-templates:variables.companyName" },
  { token: "{{eventName}}", labelKey: "email-templates:variables.eventName" },
  { token: "{{eventDate}}", labelKey: "email-templates:variables.eventDate" },
  { token: "{{invitationUrl}}", labelKey: "email-templates:variables.invitationUrl" },
] as const
