import { db } from "@vulkan/lib/db/index";
import { emailTemplates } from "@vulkan/lib/db/schema/email-templates";
import type { EmailTemplate } from "@vulkan/lib/db/schema/email-templates.types";

export const validEmailTemplateBody = {
  name: "Invitation",
  subject: "You are invited to {{eventName}}, {{clientName}}",
  htmlBody:
    "<p>Hello {{clientName}} from {{companyName}}. Join {{eventName}} on {{eventDate}}: <a href=\"{{invitationUrl}}\">confirm</a></p>",
  textBody:
    "Hello {{clientName}} from {{companyName}}. Join {{eventName}} on {{eventDate}}: {{invitationUrl}}",
};

export async function makeEmailTemplate(
  eventId: string,
  createdBy: string,
  overrides: Partial<{
    name: string;
    subject: string;
    htmlBody: string;
    textBody: string;
  }> = {},
): Promise<EmailTemplate> {
  const [row] = await db
    .insert(emailTemplates)
    .values({
      eventId,
      name: overrides.name ?? validEmailTemplateBody.name,
      subject: overrides.subject ?? validEmailTemplateBody.subject,
      htmlBody: overrides.htmlBody ?? validEmailTemplateBody.htmlBody,
      textBody: overrides.textBody ?? validEmailTemplateBody.textBody,
      createdBy,
    })
    .returning();
  return row as EmailTemplate;
}
