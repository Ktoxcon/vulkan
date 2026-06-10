import { DraftConfirmationAlreadyConfirmedError } from "@vulkan/errors/draft-confirmation.errors";
import { InvitationTokenNotFoundError } from "@vulkan/errors/invitation.errors";
import { DraftConfirmationsRepository } from "@vulkan/lib/repositories/draft-confirmations.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import type { TokenResolution } from "@vulkan/lib/repositories/invitations.repo.types";
import type {
  DraftConfirmationServiceType,
  DraftConfirmationView,
} from "@vulkan/lib/services/draft-confirmation.service.types";
import type { DraftConfirmationData } from "@vulkan/lib/validators/draft-confirmation.schemas.types";

export const DraftConfirmationService: DraftConfirmationServiceType = {
  async getByToken(token: string): Promise<DraftConfirmationView> {
    const resolution = await DraftConfirmationService.resolveOpenInvitation(
      token,
    );

    const draft = await DraftConfirmationsRepository.findByInvitationId(
      resolution.invitation.id,
    );

    if (!draft) {
      return { data: {}, updatedAt: null };
    }

    return {
      data: draft.data as DraftConfirmationData,
      updatedAt: draft.updatedAt,
    };
  },

  async saveByToken(
    token: string,
    data: DraftConfirmationData,
  ): Promise<DraftConfirmationView> {
    const resolution = await DraftConfirmationService.resolveOpenInvitation(
      token,
    );

    const draft = await DraftConfirmationsRepository.upsertByInvitationId(
      resolution.invitation.id,
      data,
    );

    return {
      data: draft.data as DraftConfirmationData,
      updatedAt: draft.updatedAt,
    };
  },

  async resolveOpenInvitation(token: string): Promise<TokenResolution> {
    const resolution = await InvitationsRepository.findByToken(token);

    if (!resolution) {
      throw new InvitationTokenNotFoundError();
    }

    if (resolution.invitation.confirmedAt !== null) {
      throw new DraftConfirmationAlreadyConfirmedError();
    }

    return resolution;
  },
};
