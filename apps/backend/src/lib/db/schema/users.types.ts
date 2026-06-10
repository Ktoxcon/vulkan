import { users } from "@vulkan/lib/db/schema/users";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
