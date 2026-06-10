import { draftConfirmations } from "@vulkan/lib/db/schema/draft-confirmations";

export type DraftConfirmation = typeof draftConfirmations.$inferSelect;
export type NewDraftConfirmation = typeof draftConfirmations.$inferInsert;
