import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";
import { EventReadinessService } from "@vulkan/lib/services/event-readiness.service";
import { makeEmailTemplate } from "@tests/fixtures/email-templates";
import { makeInvitation } from "@tests/fixtures/invitations";
import { assignOffering } from "@tests/fixtures/offerings";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

async function seedReadyShapedEvent(): Promise<SalesEvent> {
  const owner = await makeUser({ role: "sales" });
  return makeSalesEvent(owner.id, { status: EventStatus.DRAFT });
}

async function seedFullyReady(event: SalesEvent): Promise<void> {
  await assignOffering(event.id, event.ownerId);
  await makeEmailTemplate(event.id, event.ownerId);
  const { clients } = await makeRosterWithClients(event.id, event.ownerId, 5);
  for (const client of clients) {
    await makeInvitation(event.id, client.id);
  }
}

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("EventReadinessService.evaluate", () => {
  it("reports the local checks true but downstream gaps when no data is seeded", async () => {
    const event = await seedReadyShapedEvent();

    const { ready, checks } = await EventReadinessService.evaluate(event);

    expect(checks.detailsConfigured).toBe(true);
    expect(checks.capacityConfigured).toBe(true);
    expect(checks.registrationDatesValid).toBe(true);
    expect(checks.offeringsAssigned).toBe(false);
    expect(checks.rosterUploaded).toBe(false);
    expect(checks.rosterHasValidClient).toBe(false);
    expect(checks.inviteTokensReady).toBe(false);
    expect(checks.emailTemplateConfigured).toBe(false);
    expect(ready).toBe(false);
  });

  it("is ready when every check passes (seeded roster + invitations + template + offering)", async () => {
    const event = await seedReadyShapedEvent();
    await seedFullyReady(event);

    const { ready, checks } = await EventReadinessService.evaluate(event);

    expect(checks).toEqual({
      detailsConfigured: true,
      capacityConfigured: true,
      offeringsAssigned: true,
      rosterUploaded: true,
      rosterHasValidClient: true,
      inviteTokensReady: true,
      emailTemplateConfigured: true,
      registrationDatesValid: true,
    });
    expect(ready).toBe(true);
  });

  it("rosterHasValidClient is false when the roster exists but has zero clients", async () => {
    const event = await seedReadyShapedEvent();
    await makeRosterWithClients(event.id, event.ownerId, 0);

    const { checks } = await EventReadinessService.evaluate(event);
    expect(checks.rosterUploaded).toBe(true);
    expect(checks.rosterHasValidClient).toBe(false);
  });

  it("inviteTokensReady is false when not every roster client has an invitation", async () => {
    const event = await seedReadyShapedEvent();
    const { clients } = await makeRosterWithClients(event.id, event.ownerId, 3);
    await makeInvitation(event.id, clients[0]!.id);

    const { checks } = await EventReadinessService.evaluate(event);
    expect(checks.rosterUploaded).toBe(true);
    expect(checks.rosterHasValidClient).toBe(true);
    expect(checks.inviteTokensReady).toBe(false);
  });

  it("flags invalid registration dates (regEnd after eventStart)", async () => {
    const owner = await makeUser({ role: "sales" });
    const event = await makeSalesEvent(owner.id, {
      name: "Bad Dates",
      capacity: 10,
      eventStartDate: new Date("2026-08-10T00:00:00.000Z"),
      registrationStartDate: new Date("2026-08-01T00:00:00.000Z"),
      registrationEndDate: new Date("2026-08-20T00:00:00.000Z"),
      status: EventStatus.DRAFT,
    });

    const { checks, ready } = await EventReadinessService.evaluate(event);
    expect(checks.registrationDatesValid).toBe(false);
    expect(ready).toBe(false);
  });

  it("does not change the event status (stays Draft)", async () => {
    const event = await seedReadyShapedEvent();
    await seedFullyReady(event);

    await EventReadinessService.evaluate(event);

    const reloaded = await SalesEventsRepository.findById(event.id);
    expect(reloaded?.status).toBe(EventStatus.DRAFT);
  });
});
