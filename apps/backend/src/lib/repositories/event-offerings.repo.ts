import { db } from "@vulkan/lib/db/index";
import { eventOfferingChanges } from "@vulkan/lib/db/schema/event-offering-changes";
import type { EventOfferingChange } from "@vulkan/lib/db/schema/event-offering-changes.types";
import { eventOfferings } from "@vulkan/lib/db/schema/event-offerings";
import type { EventOffering } from "@vulkan/lib/db/schema/event-offerings.types";
import { offerings } from "@vulkan/lib/db/schema/offerings";
import type { Offering } from "@vulkan/lib/db/schema/offerings.types";
import type {
  AssignedOffering,
  AssignParams,
} from "@vulkan/lib/repositories/event-offerings.repo.types";
import { and, eq, inArray } from "drizzle-orm";

export const EventOfferingsRepository = {
  async findById(
    eventOfferingId: string,
  ): Promise<EventOffering | undefined> {
    const [row] = await db
      .select()
      .from(eventOfferings)
      .where(eq(eventOfferings.id, eventOfferingId))
      .limit(1);
    return row;
  },

  async findAssignment(
    eventId: string,
    offeringId: string,
  ): Promise<EventOffering | undefined> {
    const [row] = await db
      .select()
      .from(eventOfferings)
      .where(
        and(
          eq(eventOfferings.eventId, eventId),
          eq(eventOfferings.offeringId, offeringId),
        ),
      )
      .limit(1);
    return row;
  },

  async countAssigned(eventId: string): Promise<number> {
    const rows = await db
      .select({ id: eventOfferings.id })
      .from(eventOfferings)
      .where(eq(eventOfferings.eventId, eventId));
    return rows.length;
  },

  async listAssignedOfferings(eventId: string): Promise<Offering[]> {
    const rows = await db
      .select({ offering: offerings })
      .from(eventOfferings)
      .innerJoin(offerings, eq(eventOfferings.offeringId, offerings.id))
      .where(eq(eventOfferings.eventId, eventId));
    return rows.map((row) => row.offering);
  },

  async listAssigned(eventId: string): Promise<AssignedOffering[]> {
    return db
      .select({ id: eventOfferings.id, offering: offerings })
      .from(eventOfferings)
      .innerJoin(offerings, eq(eventOfferings.offeringId, offerings.id))
      .where(eq(eventOfferings.eventId, eventId));
  },

  async findSelectableOfferingIds(
    eventId: string,
    offeringIds: string[],
  ): Promise<string[]> {
    const rows = await db
      .select({ offeringId: eventOfferings.offeringId })
      .from(eventOfferings)
      .innerJoin(offerings, eq(eventOfferings.offeringId, offerings.id))
      .where(
        and(
          eq(eventOfferings.eventId, eventId),
          eq(offerings.isActive, true),
          inArray(eventOfferings.offeringId, offeringIds),
        ),
      );
    return rows.map((row) => row.offeringId);
  },

  async assign(params: AssignParams): Promise<EventOffering> {
    return db.transaction(async (tx) => {
      const [assignment] = await tx
        .insert(eventOfferings)
        .values({
          eventId: params.eventId,
          offeringId: params.offeringId,
          assignedBy: params.actorId,
        })
        .returning();

      await tx.insert(eventOfferingChanges).values({
        eventId: params.eventId,
        offeringId: params.offeringId,
        action: "added",
        actorId: params.actorId,
      });

      return assignment as EventOffering;
    });
  },

  async remove(
    eventOffering: EventOffering,
    actorId: string,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(eventOfferings)
        .where(eq(eventOfferings.id, eventOffering.id));

      await tx.insert(eventOfferingChanges).values({
        eventId: eventOffering.eventId,
        offeringId: eventOffering.offeringId,
        action: "removed",
        actorId,
      });
    });
  },

  async listChanges(eventId: string): Promise<EventOfferingChange[]> {
    return db
      .select()
      .from(eventOfferingChanges)
      .where(eq(eventOfferingChanges.eventId, eventId));
  },
};
