import { db } from "@vulkan/lib/db";
import { eventOfferingChanges } from "@vulkan/lib/db/schema/event-offering-changes";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import { EventOfferingsService } from "@vulkan/lib/services/event-offerings.service";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import { makeOffering } from "@tests/fixtures/offerings";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("EventOfferingsService", () => {
  describe("assign", () => {
    it("assigns an offering, records assignedBy, and writes an audit row", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      const assignment = await EventOfferingsService.assign(
        event.id,
        offering.id,
        owner.id,
      );
      expect(assignment.eventId).toBe(event.id);
      expect(assignment.offeringId).toBe(offering.id);
      expect(assignment.assignedBy).toBe(owner.id);
      expect(assignment.assignedAt).toBeInstanceOf(Date);

      const changes = await db
        .select()
        .from(eventOfferingChanges)
        .where(eq(eventOfferingChanges.eventId, event.id));
      expect(changes).toHaveLength(1);
      expect(changes[0]!.action).toBe("added");
      expect(changes[0]!.actorId).toBe(owner.id);
    });

    it("lists assigned offerings for the event", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      const assignment = await EventOfferingsService.assign(
        event.id,
        offering.id,
        owner.id,
      );
      const list = await EventOfferingsService.list(event.id);
      expect(list).toHaveLength(1);
      expect(list[0]!.id).toBe(assignment.id);
      expect(list[0]!.offering.id).toBe(offering.id);
    });

    it("allows assignment after launch (dynamic offerings, no Draft lock)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id, { status: "active" });
      const offering = await makeOffering();

      const assignment = await EventOfferingsService.assign(
        event.id,
        offering.id,
        owner.id,
      );
      expect(assignment.offeringId).toBe(offering.id);
    });

    it("rejects assigning an inactive offering (OFFERING_INACTIVE)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering({ isActive: false });

      await expect(
        EventOfferingsService.assign(event.id, offering.id, owner.id),
      ).rejects.toMatchObject({
        code: "OFFERING_INACTIVE",
        httpStatusCode: 409,
      });
    });

    it("rejects a duplicate assignment (DUPLICATE_EVENT_OFFERING)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      await EventOfferingsService.assign(event.id, offering.id, owner.id);
      await expect(
        EventOfferingsService.assign(event.id, offering.id, owner.id),
      ).rejects.toMatchObject({
        code: "DUPLICATE_EVENT_OFFERING",
        httpStatusCode: 409,
      });
    });

    it("rejects assignment of an unknown offering (OFFERING_NOT_FOUND)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      await expect(
        EventOfferingsService.assign(
          event.id,
          "22222222-2222-2222-2222-222222222222",
          owner.id,
        ),
      ).rejects.toMatchObject({ code: "OFFERING_NOT_FOUND" });
    });
  });

  describe("remove", () => {
    it("removes an assignment by eventOfferingId and writes a 'removed' audit row", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      const assignment = await EventOfferingsService.assign(
        event.id,
        offering.id,
        owner.id,
      );
      await EventOfferingsService.remove(event.id, assignment.id, owner.id);

      const list = await EventOfferingsService.list(event.id);
      expect(list).toHaveLength(0);

      const changes = await db
        .select()
        .from(eventOfferingChanges)
        .where(eq(eventOfferingChanges.eventId, event.id));
      expect(changes).toHaveLength(2);
      expect(changes.map((change) => change.action).sort()).toEqual([
        "added",
        "removed",
      ]);
    });

    it("allows removal after launch (dynamic offerings, no Draft lock)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();
      const assignment = await EventOfferingsService.assign(
        event.id,
        offering.id,
        owner.id,
      );

      await db
        .update(salesEvents)
        .set({ status: "active" })
        .where(eq(salesEvents.id, event.id));

      await EventOfferingsService.remove(event.id, assignment.id, owner.id);
      const list = await EventOfferingsService.list(event.id);
      expect(list).toHaveLength(0);
    });

    it("rejects removing an unknown eventOfferingId (EVENT_OFFERING_NOT_ASSIGNED)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      await expect(
        EventOfferingsService.remove(
          event.id,
          "22222222-2222-2222-2222-222222222222",
          owner.id,
        ),
      ).rejects.toMatchObject({ code: "EVENT_OFFERING_NOT_ASSIGNED" });
    });

    it("rejects removing an assignment that belongs to another event (EVENT_OFFERING_NOT_ASSIGNED)", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const otherEvent = await makeSalesEvent(owner.id);
      const offering = await makeOffering();
      const assignment = await EventOfferingsService.assign(
        event.id,
        offering.id,
        owner.id,
      );

      await expect(
        EventOfferingsService.remove(otherEvent.id, assignment.id, owner.id),
      ).rejects.toMatchObject({ code: "EVENT_OFFERING_NOT_ASSIGNED" });
    });
  });

  describe("assertOfferingsSelectable", () => {
    it("passes for currently-assigned, active offerings", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const a = await makeOffering();
      const b = await makeOffering();
      await EventOfferingsService.assign(event.id, a.id, owner.id);
      await EventOfferingsService.assign(event.id, b.id, owner.id);

      await expect(
        EventOfferingsService.assertOfferingsSelectable(event.id, [a.id, b.id]),
      ).resolves.toBeUndefined();
    });

    it("passes for an empty selection", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      await expect(
        EventOfferingsService.assertOfferingsSelectable(event.id, []),
      ).resolves.toBeUndefined();
    });

    it("throws OFFERING_NOT_SELECTABLE for an unassigned offering, listing the offending id", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const assigned = await makeOffering();
      const unassigned = await makeOffering();
      await EventOfferingsService.assign(event.id, assigned.id, owner.id);

      await expect(
        EventOfferingsService.assertOfferingsSelectable(event.id, [
          assigned.id,
          unassigned.id,
        ]),
      ).rejects.toMatchObject({
        code: "OFFERING_NOT_SELECTABLE",
        httpStatusCode: 409,
        details: { offeringIds: [unassigned.id] },
      });
    });

    it("throws OFFERING_NOT_SELECTABLE when an assigned offering became inactive", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();
      await EventOfferingsService.assign(event.id, offering.id, owner.id);

      await OfferingsRepository.softDelete(offering.id);

      await expect(
        EventOfferingsService.assertOfferingsSelectable(event.id, [offering.id]),
      ).rejects.toMatchObject({
        code: "OFFERING_NOT_SELECTABLE",
        details: { offeringIds: [offering.id] },
      });
    });
  });
});
