import type { PortfolioStatus as PortfolioStatusValue } from "@vulkan/lib/constants/portfolio-status.types";
import { db } from "@vulkan/lib/db/index";
import type { Portfolio } from "@vulkan/lib/db/schema/portfolios.types";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { PortfolioGenerationService } from "@vulkan/lib/services/portfolio-generation.service";
import { PortfolioService } from "@vulkan/lib/services/portfolio.service";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeOffering } from "@tests/fixtures/offerings";
import { makeSeatReservation } from "@tests/fixtures/seat-reservations";
import {
  seedInvitationFlow,
  type InvitationFlowSeed,
} from "@tests/helpers/seed-invitation-flow";

export type PricedSelection = {
  type: string;
  basePrice: string;
  name?: string;
};

export async function assignPricedOffering(
  eventId: string,
  actorId: string,
  selection: PricedSelection,
): Promise<string> {
  const offering = await makeOffering({
    type: selection.type,
    basePrice: selection.basePrice,
    ...(selection.name !== undefined ? { name: selection.name } : {}),
  });
  await EventOfferingsRepository.assign({
    eventId,
    offeringId: offering.id,
    actorId,
  });
  return offering.id;
}

export const DefaultSelections: PricedSelection[] = [
  { type: OfferingType.SERVICE, basePrice: "800.00", name: "Audit" },
  { type: OfferingType.SERVICE, basePrice: "900.00", name: "Consulting" },
  { type: OfferingType.PRODUCT, basePrice: "100.00", name: "Widget A" },
  { type: OfferingType.PRODUCT, basePrice: "100.00", name: "Widget B" },
  { type: OfferingType.PRODUCT, basePrice: "100.00", name: "Widget C" },
];

export type GeneratedPortfolioSeed = {
  portfolio: Portfolio;
  ownerId: string;
  ownerEmail: string;
  eventId: string;
  clientId: string;
  offeringIds: string[];
};

export async function makeGeneratedPortfolio(
  selections: PricedSelection[] = DefaultSelections,
): Promise<GeneratedPortfolioSeed> {
  const { owner, event, invitation, client } = await seedInvitationFlow(
    {},
    {},
  );
  const offeringIds: string[] = [];
  for (const selection of selections) {
    offeringIds.push(await assignPricedOffering(event.id, owner.id, selection));
  }

  const confirmation = await makeAttendanceConfirmation(
    event.id,
    invitation.id,
    client.id,
    { email: client.email },
  );

  const portfolio = await db.transaction((tx) =>
    PortfolioGenerationService.generate(
      {
        event,
        client: {
          id: client.id,
          email: client.email,
          name: client.name,
          company: client.company,
        },
        confirmationId: confirmation.id,
        ownerId: owner.id,
        offeringIds,
      },
      tx,
    ),
  );

  return {
    portfolio,
    ownerId: owner.id,
    ownerEmail: owner.email,
    eventId: event.id,
    clientId: client.id,
    offeringIds,
  };
}

export type ConfirmReadySeed = InvitationFlowSeed & {
  offeringIds: string[];
};

export async function seedConfirmReady(
  selections: PricedSelection[] = DefaultSelections,
): Promise<ConfirmReadySeed> {
  const seed = await seedInvitationFlow();
  await makeSeatReservation(seed.event.id, seed.invitation.id);
  const offeringIds: string[] = [];
  for (const selection of selections) {
    offeringIds.push(
      await assignPricedOffering(seed.event.id, seed.owner.id, selection),
    );
  }
  return { ...seed, offeringIds };
}

export const SingleDayStart = "2099-08-30T00:00:00.000Z";

export async function advancePortfolioStatus(
  portfolio: Portfolio,
  toStatus: PortfolioStatusValue,
  actorId: string,
): Promise<Portfolio> {
  return PortfolioService.updateStatus(portfolio, toStatus, {
    id: actorId,
    role: "admin",
  });
}
