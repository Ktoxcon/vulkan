import { clientInterests } from "@vulkan/lib/db/schema/client-interests";

export type ClientInterest = typeof clientInterests.$inferSelect;
export type NewClientInterest = typeof clientInterests.$inferInsert;
