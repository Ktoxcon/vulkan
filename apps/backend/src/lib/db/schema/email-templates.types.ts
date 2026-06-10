import { emailTemplates } from "@vulkan/lib/db/schema/email-templates";

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
