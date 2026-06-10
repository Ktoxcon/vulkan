import { db } from "@vulkan/lib/db/index";
import { emailTemplates } from "@vulkan/lib/db/schema/email-templates";
import type {
  EmailTemplate,
  NewEmailTemplate,
} from "@vulkan/lib/db/schema/email-templates.types";
import type { UpdateEmailTemplateValues } from "@vulkan/lib/repositories/email-templates.repo.types";
import { eq } from "drizzle-orm";

export const EmailTemplatesRepository = {
  async findByEventId(eventId: string): Promise<EmailTemplate | undefined> {
    const [row] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.eventId, eventId))
      .limit(1);
    return row;
  },

  async insert(values: NewEmailTemplate): Promise<EmailTemplate> {
    const [row] = await db.insert(emailTemplates).values(values).returning();
    return row as EmailTemplate;
  },

  async update(
    eventId: string,
    values: UpdateEmailTemplateValues,
  ): Promise<EmailTemplate> {
    const [row] = await db
      .update(emailTemplates)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(emailTemplates.eventId, eventId))
      .returning();
    return row as EmailTemplate;
  },
};
