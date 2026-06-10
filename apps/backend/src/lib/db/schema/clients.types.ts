import { clients } from "@vulkan/lib/db/schema/clients";

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
