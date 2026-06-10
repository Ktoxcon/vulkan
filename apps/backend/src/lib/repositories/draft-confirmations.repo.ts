import { db } from "@vulkan/lib/db";
import { draftConfirmations } from "@vulkan/lib/db/schema/draft-confirmations";
import type { DraftConfirmation } from "@vulkan/lib/db/schema/draft-confirmations.types";
import type { DraftConfirmationsRepositoryType } from "@vulkan/lib/repositories/draft-confirmations.repo.types";
import type { DraftConfirmationData } from "@vulkan/lib/validators/draft-confirmation.schemas.types";
import { eq } from "drizzle-orm";

export const DraftConfirmationsRepository: DraftConfirmationsRepositoryType = {
  async findByInvitationId(
    invitationId: string,
  ): Promise<DraftConfirmation | undefined> {
    const [row] = await db
      .select()
      .from(draftConfirmations)
      .where(eq(draftConfirmations.invitationId, invitationId))
      .limit(1);
    return row;
  },

  async upsertByInvitationId(
    invitationId: string,
    data: DraftConfirmationData,
  ): Promise<DraftConfirmation> {
    const now = new Date();
    const [row] = await db
      .insert(draftConfirmations)
      .values({ invitationId, data })
      .onConflictDoUpdate({
        target: draftConfirmations.invitationId,
        set: { data, updatedAt: now },
      })
      .returning();
    return row as DraftConfirmation;
  },
};
