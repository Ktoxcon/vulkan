import { offerings } from "@vulkan/lib/db/schema/offerings";

export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;
