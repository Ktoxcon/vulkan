import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";
import { EventLifecycleService } from "@vulkan/lib/services/event-lifecycle.service";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
import { makeInvitation } from "@tests/fixtures/invitations";
import { assignOffering } from "@tests/fixtures/offerings";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

async function seedEvent(
  status: string,
  overrides: { eventStartDate?: Date; eventEndDate?: Date; capacity?: number } = {},
): Promise<SalesEvent> {
  const owner = await makeUser({ role: "sales" });
  return makeSalesEvent(owner.id, { status, ...overrides });
}

async function makeReady(event: SalesEvent): Promise<void> {
  await assignOffering(event.id, event.ownerId);
  await makeEmailTemplate(event.id, event.ownerId);
  const { clients } = await makeRosterWithClients(event.id, event.ownerId, 5);
  for (const client of clients) {
    await makeInvitation(event.id, client.id);
  }
}

async function seedConfirmedSeats(
  event: SalesEvent,
  seats: number,
): Promise<void> {
  const { clients } = await makeRosterWithClients(
    event.id,
    event.ownerId,
    seats,
  );
  for (const client of clients) {
    const invitation = await makeInvitation(event.id, client.id);
    await makeAttendanceConfirmation(event.id, invitation.id, client.id);
  }
}

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("EventLifecycleService", () => {
  describe("transition draft -> active (launch)", () => {
    it("launches a ready Draft event and flips it to Active", async () => {
      const event = await seedEvent(EventStatus.DRAFT);
      await makeReady(event);

      const updated = await EventLifecycleService.transition(
        event,
        EventStatus.ACTIVE,
      );
      expect(updated.status).toBe(EventStatus.ACTIVE);

      const reloaded = await SalesEventsRepository.findById(event.id);
      expect(reloaded?.status).toBe(EventStatus.ACTIVE);
    });

    it("rejects launch with EVENT_NOT_READY and leaves status Draft", async () => {
      const event = await seedEvent(EventStatus.DRAFT);

      await expect(
        EventLifecycleService.transition(event, EventStatus.ACTIVE),
      ).rejects.toMatchObject({ code: "EVENT_NOT_READY", httpStatusCode: 409 });

      const reloaded = await SalesEventsRepository.findById(event.id);
      expect(reloaded?.status).toBe(EventStatus.DRAFT);
    });

    it("includes the failing checks in the EVENT_NOT_READY details", async () => {
      const event = await seedEvent(EventStatus.DRAFT);
      await EventLifecycleService.transition(event, EventStatus.ACTIVE).then(
        () => {
          throw new Error("expected rejection");
        },
        (error: unknown) => {
          const details = (error as { details: Record<string, boolean> })
            .details;
          expect(details.offeringsAssigned).toBe(false);
        },
      );
    });

    it("rejects launching an already-active event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.ACTIVE);
      await makeReady(event);
      await expect(
        EventLifecycleService.transition(event, EventStatus.ACTIVE),
      ).rejects.toMatchObject({
        code: "ILLEGAL_EVENT_TRANSITION",
        httpStatusCode: 409,
      });
    });

    it("rejects launching a closed event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.CLOSED);
      await makeReady(event);
      await expect(
        EventLifecycleService.transition(event, EventStatus.ACTIVE),
      ).rejects.toMatchObject({ code: "ILLEGAL_EVENT_TRANSITION" });
    });
  });

  describe("transition active -> paused (pause)", () => {
    it("pauses an active event", async () => {
      const event = await seedEvent(EventStatus.ACTIVE);
      const updated = await EventLifecycleService.transition(
        event,
        EventStatus.PAUSED,
      );
      expect(updated.status).toBe(EventStatus.PAUSED);
    });

    it("rejects pausing a Draft event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.DRAFT);
      await expect(
        EventLifecycleService.transition(event, EventStatus.PAUSED),
      ).rejects.toMatchObject({ code: "ILLEGAL_EVENT_TRANSITION" });
    });

    it("rejects pausing a closed event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.CLOSED);
      await expect(
        EventLifecycleService.transition(event, EventStatus.PAUSED),
      ).rejects.toMatchObject({ code: "ILLEGAL_EVENT_TRANSITION" });
    });
  });

  describe("transition paused -> active (resume)", () => {
    it("resumes a paused event without re-gating readiness", async () => {
      const event = await seedEvent(EventStatus.PAUSED);
      const updated = await EventLifecycleService.transition(
        event,
        EventStatus.ACTIVE,
      );
      expect(updated.status).toBe(EventStatus.ACTIVE);
    });

    it("rejects resuming a closed event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.CLOSED);
      await expect(
        EventLifecycleService.transition(event, EventStatus.ACTIVE),
      ).rejects.toMatchObject({ code: "ILLEGAL_EVENT_TRANSITION" });
    });
  });

  describe("transition -> closed (close)", () => {
    it("closes an active event", async () => {
      const event = await seedEvent(EventStatus.ACTIVE);
      const updated = await EventLifecycleService.transition(
        event,
        EventStatus.CLOSED,
      );
      expect(updated.status).toBe(EventStatus.CLOSED);
    });

    it("closes a paused event", async () => {
      const event = await seedEvent(EventStatus.PAUSED);
      const updated = await EventLifecycleService.transition(
        event,
        EventStatus.CLOSED,
      );
      expect(updated.status).toBe(EventStatus.CLOSED);
    });

    it("rejects closing a Draft event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.DRAFT);
      await expect(
        EventLifecycleService.transition(event, EventStatus.CLOSED),
      ).rejects.toMatchObject({ code: "ILLEGAL_EVENT_TRANSITION" });
    });

    it("rejects closing an already-closed event (ILLEGAL_EVENT_TRANSITION)", async () => {
      const event = await seedEvent(EventStatus.CLOSED);
      await expect(
        EventLifecycleService.transition(event, EventStatus.CLOSED),
      ).rejects.toMatchObject({ code: "ILLEGAL_EVENT_TRANSITION" });
    });
  });

  describe("auto-close", () => {
    it("auto-closes when confirmed seats reach capacity", async () => {
      const event = await seedEvent(EventStatus.ACTIVE, { capacity: 10 });
      await seedConfirmedSeats(event, 10);

      expect(await EventLifecycleService.shouldAutoClose(event)).toBe(true);
      const closed = await EventLifecycleService.maybeAutoClose(event);
      expect(closed.status).toBe(EventStatus.CLOSED);
    });

    it("auto-closes when the event end date has passed", async () => {
      const event = await seedEvent(EventStatus.ACTIVE, {
        eventStartDate: new Date("2020-01-01T00:00:00.000Z"),
        eventEndDate: new Date("2020-01-02T00:00:00.000Z"),
      });

      expect(await EventLifecycleService.shouldAutoClose(event)).toBe(true);
      const closed = await EventLifecycleService.maybeAutoClose(event);
      expect(closed.status).toBe(EventStatus.CLOSED);
    });

    it("falls back to eventStartDate when there is no end date", async () => {
      const event = await seedEvent(EventStatus.ACTIVE, {
        eventStartDate: new Date("2020-01-01T00:00:00.000Z"),
      });
      expect(await EventLifecycleService.shouldAutoClose(event)).toBe(true);
    });

    it("does NOT auto-close a future event under capacity", async () => {
      const event = await seedEvent(EventStatus.ACTIVE, {
        eventStartDate: new Date("2099-01-01T00:00:00.000Z"),
        capacity: 30,
      });
      expect(await EventLifecycleService.shouldAutoClose(event)).toBe(false);
      const same = await EventLifecycleService.maybeAutoClose(event);
      expect(same.status).toBe(EventStatus.ACTIVE);
    });

    it("does NOT auto-close an already-closed event", async () => {
      const event = await seedEvent(EventStatus.CLOSED, {
        eventStartDate: new Date("2020-01-01T00:00:00.000Z"),
      });
      expect(await EventLifecycleService.shouldAutoClose(event)).toBe(false);
    });
  });
});
