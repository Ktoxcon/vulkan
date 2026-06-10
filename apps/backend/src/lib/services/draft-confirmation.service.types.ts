import type { TokenResolution } from "@vulkan/lib/repositories/invitations.repo.types";
import type { DraftConfirmationData } from "@vulkan/lib/validators/draft-confirmation.schemas.types";

export type DraftConfirmationView = {
  data: DraftConfirmationData;
  updatedAt: Date | null;
};

export type DraftConfirmationServiceType = {
  getByToken(token: string): Promise<DraftConfirmationView>;
  saveByToken(
    token: string,
    data: DraftConfirmationData,
  ): Promise<DraftConfirmationView>;
  resolveOpenInvitation(token: string): Promise<TokenResolution>;
};
