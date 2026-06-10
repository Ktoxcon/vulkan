import { eventOfferingChanges } from "@vulkan/lib/db/schema/event-offering-changes";

export type EventOfferingChange = typeof eventOfferingChanges.$inferSelect;
export type NewEventOfferingChange = typeof eventOfferingChanges.$inferInsert;
