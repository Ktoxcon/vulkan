import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { EventOfferingsRepository } from "@vulkan/lib/repositories/event-offerings.repo";
import { makeInvitation } from "@tests/fixtures/invitations";
import { makeOffering } from "@tests/fixtures/offerings";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;
let app: Express;

async function seed() {
  const owner = await makeUser({ role: "sales" });
  const event = await makeSalesEvent(owner.id, { status: EventStatus.ACTIVE });
  const { clients } = await makeRosterWithClients(event.id, owner.id, 1);
  const invitation = await makeInvitation(event.id, clients[0]!.id);
  return { owner, event, invitation };
}

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("GET /invitations/:token/offerings (6.9, public)", () => {
  it("is public and groups assigned active offerings by products/services", async () => {
    const { owner, event, invitation } = await seed();
    const product = await makeOffering({
      type: "product",
      name: "Cloud Server",
      basePrice: "100.00",
    });
    const service = await makeOffering({
      type: "service",
      name: "Onboarding",
      basePrice: "50.00",
    });
    await EventOfferingsRepository.assign({
      eventId: event.id,
      offeringId: product.id,
      actorId: owner.id,
    });
    await EventOfferingsRepository.assign({
      eventId: event.id,
      offeringId: service.id,
      actorId: owner.id,
    });

    const res = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/offerings`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.services).toHaveLength(1);
    expect(res.body.data.products[0]).toEqual({
      id: product.id,
      name: "Cloud Server",
      description: null,
      basePrice: "100.00",
    });
    expect(res.body.data.services[0].name).toBe("Onboarding");
  });

  it("excludes inactive and unassigned offerings", async () => {
    const { owner, event, invitation } = await seed();
    const active = await makeOffering({ type: "product", isActive: true });
    const inactive = await makeOffering({ type: "product", isActive: false });
    await makeOffering({ type: "service" });

    await EventOfferingsRepository.assign({
      eventId: event.id,
      offeringId: active.id,
      actorId: owner.id,
    });
    await EventOfferingsRepository.assign({
      eventId: event.id,
      offeringId: inactive.id,
      actorId: owner.id,
    });

    const res = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/offerings`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].id).toBe(active.id);
    expect(res.body.data.services).toHaveLength(0);
  });

  it("returns empty groups when nothing is assigned", async () => {
    const { invitation } = await seed();
    const res = await request(app).get(
      `${API_PREFIX}/invitations/${invitation.token}/offerings`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(0);
    expect(res.body.data.services).toHaveLength(0);
  });

  it("404 INVITATION_TOKEN_NOT_FOUND for an unknown token", async () => {
    const res = await request(app).get(`${API_PREFIX}/invitations/does-not-exist/offerings`,
    );
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("INVITATION_TOKEN_NOT_FOUND");
  });
});
