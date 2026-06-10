import { EventStatus } from "@vulkan/lib/constants/event-status";
import { UserRoles } from "@vulkan/lib/constants/roles";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";
import { SalesEventsService } from "@vulkan/lib/services/sales-events.service";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

async function seedConfirmedSeats(
  eventId: string,
  uploadedBy: string,
  seats: number,
): Promise<void> {
  const { clients } = await makeRosterWithClients(eventId, uploadedBy, seats);
  for (const client of clients) {
    const invitation = await makeInvitation(eventId, client.id);
    await makeAttendanceConfirmation(eventId, invitation.id, client.id);
  }
}

let testDb: TestDb;
let owner: Actor;
let other: Actor;
let admin: Actor;

const baseInput = {
  name: "Promo",
  capacity: 30,
  eventStartDate: new Date("2099-08-30T00:00:00.000Z"),
  registrationStartDate: new Date("2026-08-01T00:00:00.000Z"),
  registrationEndDate: new Date("2026-08-15T00:00:00.000Z"),
};

async function actor(email: string, role: string): Promise<Actor> {
  const user = await makeUser({ email, role });
  return { id: user.id, role };
}

beforeEach(async () => {
  testDb = await createTestDb();
  owner = await actor("owner@vulkan.com", UserRoles.SALES);
  other = await actor("other@vulkan.com", UserRoles.SALES);
  admin = await actor("admin@vulkan.com", UserRoles.ADMIN);
});

afterEach(async () => {
  await testDb.close();
});

describe("SalesEventsService", () => {
  describe("create", () => {
    it("creates the event in Draft owned by the actor", async () => {
      const event = await SalesEventsService.create(owner, baseInput);
      expect(event.status).toBe(EventStatus.DRAFT);
      expect(event.ownerId).toBe(owner.id);
      expect(event.capacity).toBe(30);
    });

    it("defaults reservationTimeoutMinutes/requireConfirmation", async () => {
      const event = await SalesEventsService.create(owner, baseInput);
      expect(event.reservationTimeoutMinutes).toBe(0);
      expect(event.requireConfirmation).toBe(false);
    });
  });

  describe("getById / ownership", () => {
    it("returns the event to its owner", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      const fetched = await SalesEventsService.getById(owner, created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("returns the event to an admin", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      const fetched = await SalesEventsService.getById(admin, created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("forbids a non-owner non-admin (EVENT_FORBIDDEN)", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      await expect(
        SalesEventsService.getById(other, created.id),
      ).rejects.toMatchObject({ code: "EVENT_FORBIDDEN", httpStatusCode: 403 });
    });

    it("EVENT_NOT_FOUND for a missing event", async () => {
      await expect(
        SalesEventsService.getById(
          owner,
          "11111111-1111-1111-1111-111111111111",
        ),
      ).rejects.toMatchObject({ code: "EVENT_NOT_FOUND", httpStatusCode: 404 });
    });
  });

  describe("list", () => {
    it("scopes to the owner for non-admins", async () => {
      await SalesEventsService.create(owner, baseInput);
      await SalesEventsService.create(other, baseInput);

      const ownerList = await SalesEventsService.list(owner);
      expect(ownerList.count).toBe(1);
      expect(ownerList.items[0]?.ownerId).toBe(owner.id);
    });

    it("returns all events to an admin", async () => {
      await SalesEventsService.create(owner, baseInput);
      await SalesEventsService.create(other, baseInput);

      const adminList = await SalesEventsService.list(admin);
      expect(adminList.count).toBe(2);
    });
  });

  describe("update", () => {
    it("updates a Draft event's structural fields", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      const updated = await SalesEventsService.update(owner, created, {
        reservationTimeoutMinutes: 20,
        name: "Renamed",
      });
      expect(updated.reservationTimeoutMinutes).toBe(20);
      expect(updated.name).toBe("Renamed");
    });

    it("rejects structural changes on a non-Draft event (EVENT_FIELDS_LOCKED)", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      await SalesEventsRepository.update(created.id, {
        status: EventStatus.ACTIVE,
      });
      const active = await SalesEventsRepository.findById(created.id);

      await expect(
        SalesEventsService.update(owner, active!, {
          eventStartDate: new Date("2100-01-01T00:00:00.000Z"),
        }),
      ).rejects.toMatchObject({
        code: "EVENT_FIELDS_LOCKED",
        httpStatusCode: 409,
      });
    });

    it("allows capacity change on a non-Draft event above confirmed seats", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      await SalesEventsRepository.update(created.id, {
        status: EventStatus.ACTIVE,
      });
      const active = await SalesEventsRepository.findById(created.id);

      const updated = await SalesEventsService.update(owner, active!, {
        capacity: 50,
      });
      expect(updated.capacity).toBe(50);
    });

    it("rejects capacity below confirmed seats (CAPACITY_BELOW_CONFIRMED)", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      await seedConfirmedSeats(created.id, owner.id, 20);

      await expect(
        SalesEventsService.update(owner, created, { capacity: 10 }),
      ).rejects.toMatchObject({
        code: "CAPACITY_BELOW_CONFIRMED",
        httpStatusCode: 409,
      });
    });

    it("forbids a non-owner from updating (EVENT_FORBIDDEN)", async () => {
      const created = await SalesEventsService.create(owner, baseInput);
      await expect(
        SalesEventsService.update(other, created, { name: "Hax" }),
      ).rejects.toMatchObject({ code: "EVENT_FORBIDDEN", httpStatusCode: 403 });
    });
  });
});
