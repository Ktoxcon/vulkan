import type { EventOffering } from "@vulkan/lib/db/schema/event-offerings.types";
import type { Offering } from "@vulkan/lib/db/schema/offerings.types";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";

export async function makeOffering(
  overrides: Partial<{
    type: string;
    name: string;
    description: string | null;
    basePrice: string;
    isActive: boolean;
  }> = {},
): Promise<Offering> {
  return OfferingsRepository.create({
    type: overrides.type ?? "product",
    name: overrides.name ?? `Offering ${Math.random().toString(36).slice(2)}`,
    basePrice: overrides.basePrice ?? "10.00",
    ...(overrides.description !== undefined
      ? { description: overrides.description }
      : {}),
    ...(overrides.isActive !== undefined ? { isActive: overrides.isActive } : {}),
  });
}

export async function makeEventOffering(
  eventId: string,
  assignedBy: string,
  overrides: Partial<{
    type: string;
    name: string;
    isActive: boolean;
    offeringId: string;
  }> = {},
): Promise<EventOffering> {
  const offeringId =
    overrides.offeringId ??
    (
      await makeOffering({
        ...(overrides.type !== undefined ? { type: overrides.type } : {}),
        ...(overrides.name !== undefined ? { name: overrides.name } : {}),
        ...(overrides.isActive !== undefined
          ? { isActive: overrides.isActive }
          : {}),
      })
    ).id;

  return EventOfferingsRepository.assign({
    eventId,
    offeringId,
    actorId: assignedBy,
  });
}

export async function assignOffering(
  eventId: string,
  actorId: string,
): Promise<Offering> {
  const offering = await makeOffering({ basePrice: "0.00" });
  await EventOfferingsRepository.assign({
    eventId,
    offeringId: offering.id,
    actorId,
  });
  return offering;
}
