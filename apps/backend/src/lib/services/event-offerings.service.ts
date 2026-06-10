import {
  DuplicateEventOfferingError,
  EventOfferingNotAssignedError,
  OfferingInactiveError,
  OfferingNotFoundError,
  OfferingNotSelectableError,
} from "@vulkan/errors/offering.errors";
import type { EventOffering } from "@vulkan/lib/db/schema/event-offerings.types";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import type { AssignedOffering } from "@vulkan/lib/repositories/event-offerings.repo.types";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";

export const EventOfferingsService = {
  async list(eventId: string): Promise<AssignedOffering[]> {
    return EventOfferingsRepository.listAssigned(eventId);
  },

  async assign(
    eventId: string,
    offeringId: string,
    actorId: string,
  ): Promise<EventOffering> {
    const offering = await OfferingsRepository.findById(offeringId);
    if (!offering) {
      throw new OfferingNotFoundError();
    }

    if (!offering.isActive) {
      throw new OfferingInactiveError();
    }

    const existing = await EventOfferingsRepository.findAssignment(
      eventId,
      offeringId,
    );
    if (existing) {
      throw new DuplicateEventOfferingError();
    }

    return EventOfferingsRepository.assign({ eventId, offeringId, actorId });
  },

  async remove(
    eventId: string,
    eventOfferingId: string,
    actorId: string,
  ): Promise<void> {
    const assignment = await EventOfferingsRepository.findById(eventOfferingId);
    if (!assignment || assignment.eventId !== eventId) {
      throw new EventOfferingNotAssignedError();
    }

    await EventOfferingsRepository.remove(assignment, actorId);
  },

  async assertOfferingsSelectable(
    eventId: string,
    offeringIds: string[],
  ): Promise<void> {
    if (offeringIds.length === 0) return;

    const unique = [...new Set(offeringIds)];
    const selectable = await EventOfferingsRepository.findSelectableOfferingIds(
      eventId,
      unique,
    );
    const selectableSet = new Set(selectable);

    const missing = unique.filter((id) => !selectableSet.has(id));
    if (missing.length > 0) {
      throw new OfferingNotSelectableError(missing);
    }
  },
};
