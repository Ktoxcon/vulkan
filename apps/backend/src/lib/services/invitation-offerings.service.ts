import { InvitationTokenNotFoundError } from "@vulkan/errors/invitation.errors";
import type { Offering } from "@vulkan/lib/db/schema/offerings.types";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import type {
  ClientOfferingView,
  ClientOfferingsView,
  InvitationOfferingsServiceType,
} from "@vulkan/lib/services/invitation-offerings.service.types";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";

export const InvitationOfferingsService: InvitationOfferingsServiceType = {
  async listByToken(token: string): Promise<ClientOfferingsView> {
    const resolution = await InvitationsRepository.findByToken(token);
    if (!resolution) {
      throw new InvitationTokenNotFoundError();
    }

    const assigned = await EventOfferingsRepository.listAssignedOfferings(
      resolution.event.id,
    );

    const active = assigned.filter((offering) => offering.isActive);

    return {
      products: active
        .filter((offering) => offering.type === OfferingType.PRODUCT)
        .map(InvitationOfferingsService.toClientView),
      services: active
        .filter((offering) => offering.type === OfferingType.SERVICE)
        .map(InvitationOfferingsService.toClientView),
    };
  },

  toClientView(offering: Offering): ClientOfferingView {
    return {
      id: offering.id,
      name: offering.name,
      description: offering.description,
      basePrice: offering.basePrice,
    };
  },
};
