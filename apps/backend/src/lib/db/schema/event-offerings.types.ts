import { eventOfferings } from "@vulkan/lib/db/schema/event-offerings";

export type EventOffering = typeof eventOfferings.$inferSelect;
export type NewEventOffering = typeof eventOfferings.$inferInsert;
