export type EmailTemplate = {
  id: string
  eventId: string
  name: string
  subject: string
  htmlBody: string
  textBody: string
  createdAt: string
  updatedAt: string
}

export type EmailTemplateInput = {
  name: string
  subject: string
  htmlBody: string
  textBody: string
}

export type EmailTemplatePreview = {
  subject: string
  htmlBody: string
  textBody: string
  variables: Record<string, string>
}
