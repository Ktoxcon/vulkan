import type { DraftConfirmation } from "@vulkan/lib/db/schema/draft-confirmations.types";
import type { DraftConfirmationData } from "@vulkan/lib/validators/draft-confirmation.schemas.types";

export type DraftConfirmationsRepositoryType = {
  findByInvitationId(
    invitationId: string,
  ): Promise<DraftConfirmation | undefined>;
  upsertByInvitationId(
    invitationId: string,
    data: DraftConfirmationData,
  ): Promise<DraftConfirmation>;
};
