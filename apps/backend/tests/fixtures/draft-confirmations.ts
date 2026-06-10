import { db } from "@vulkan/lib/db/index";
import { draftConfirmations } from "@vulkan/lib/db/schema/draft-confirmations";
import type { DraftConfirmation } from "@vulkan/lib/db/schema/draft-confirmations.types";
import type { DraftConfirmationData } from "@vulkan/lib/validators/draft-confirmation.schemas.types";

export async function makeDraft(
  invitationId: string,
  data: DraftConfirmationData = {},
): Promise<DraftConfirmation> {
  const [row] = await db
    .insert(draftConfirmations)
    .values({ invitationId, data })
    .returning();
  return row as DraftConfirmation;
}
