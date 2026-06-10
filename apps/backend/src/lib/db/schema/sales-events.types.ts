import { salesEvents } from "@vulkan/lib/db/schema/sales-events";

export type SalesEvent = typeof salesEvents.$inferSelect;
export type NewSalesEvent = typeof salesEvents.$inferInsert;
