import type { Offering } from "@vulkan/lib/db/schema/offerings.types";
import type { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";

export type AssignParams = {
  eventId: string;
  offeringId: string;
  actorId: string;
};

export type AssignedOffering = {
  id: string;
  offering: Offering;
};

export type EventOfferingsRepositoryType = typeof EventOfferingsRepository;
