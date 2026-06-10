import { db } from "@vulkan/lib/db/index";
import { clients } from "@vulkan/lib/db/schema/clients";
import type { Client } from "@vulkan/lib/db/schema/clients.types";
import { inArray } from "drizzle-orm";

export const ClientsRepository = {
  async findByEmails(emails: string[]): Promise<Client[]> {
    if (emails.length === 0) return [];
    return db.select().from(clients).where(inArray(clients.email, emails));
  },
};
