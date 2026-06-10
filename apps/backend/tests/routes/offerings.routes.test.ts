import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { makeOffering } from "@tests/fixtures/offerings";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;
let app: Express;

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("offerings routes", () => {
  describe("offerings catalog", () => {
    it("rejects unauthenticated POST /offerings with 401", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .send({ type: "product", name: "X" });
      expect(res.status).toBe(401);
    });

    it("creates an offering (201) as admin and validates the body (400)", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);

      const created = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "service", name: "Managed Support", basePrice: 49.99 });
      expect(created.status).toBe(201);
      expect(created.body.success).toBe(true);
      expect(created.body.data.name).toBe("Managed Support");
      expect(created.body.data.basePrice).toBe("49.99");
      expect(created.body.data.isActive).toBe(true);

      const bad = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "bundle", name: "" });
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a duplicate (name+type) with 409 DUPLICATE_OFFERING", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);

      const first = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "product", name: "Cloud Migration", basePrice: 10 });
      expect(first.status).toBe(201);

      const dup = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "product", name: "Cloud Migration", basePrice: 20 });
      expect(dup.status).toBe(409);
      expect(dup.body.code).toBe("DUPLICATE_OFFERING");

      const sameNameOtherType = await request(app)
        .post(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .send({ type: "service", name: "Cloud Migration", basePrice: 20 });
      expect(sameNameOtherType.status).toBe(201);
    });

    it("gets and patches offerings (admin)", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      const offering = await makeOffering({ type: "product" });

      const got = await request(app)
        .get(`${API_PREFIX}/offerings/${offering.id}`)
        .set("Cookie", cookie);
      expect(got.status).toBe(200);
      expect(got.body.data.id).toBe(offering.id);

      const patched = await request(app)
        .patch(`${API_PREFIX}/offerings/${offering.id}`)
        .set("Cookie", cookie)
        .send({ name: "Renamed", isActive: false });
      expect(patched.status).toBe(200);
      expect(patched.body.data.name).toBe("Renamed");
      expect(patched.body.data.isActive).toBe(false);
    });

    it("soft-deletes via DELETE (isActive=false, row preserved)", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      const offering = await makeOffering({ isActive: true });

      const deleted = await request(app)
        .delete(`${API_PREFIX}/offerings/${offering.id}`)
        .set("Cookie", cookie);
      expect(deleted.status).toBe(200);
      expect(deleted.body.data.id).toBe(offering.id);
      expect(deleted.body.data.isActive).toBe(false);

      const stillThere = await request(app)
        .get(`${API_PREFIX}/offerings/${offering.id}`)
        .set("Cookie", cookie);
      expect(stillThere.status).toBe(200);
      expect(stillThere.body.data.isActive).toBe(false);
    });

    it("lists with search and filters", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      await makeOffering({ type: "product", name: "Cloud Backup" });
      await makeOffering({ type: "service", name: "Cloud Support" });
      await makeOffering({ type: "product", name: "On-Prem Server" });

      const byType = await request(app)
        .get(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .query({ type: "product" });
      expect(byType.status).toBe(200);
      expect(byType.body.data.count).toBe(2);

      const bySearch = await request(app)
        .get(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .query({ search: "Cloud" });
      expect(bySearch.status).toBe(200);
      expect(bySearch.body.data.count).toBe(2);
    });

    it("forces sales callers to see active offerings only", async () => {
      const admin = await makeUser({ role: "admin" });
      const sales = await makeUser({ role: "sales" });
      await makeOffering({ name: "Active One", isActive: true });
      await makeOffering({ name: "Inactive One", isActive: false });

      const adminCookie = await signIn(app, admin.email);
      const adminList = await request(app)
        .get(`${API_PREFIX}/offerings`)
        .set("Cookie", adminCookie)
        .query({ isActive: "false" });
      expect(adminList.body.data.count).toBe(1);
      expect(adminList.body.data.items[0].name).toBe("Inactive One");

      const salesCookie = await signIn(app, sales.email);
      const salesList = await request(app)
        .get(`${API_PREFIX}/offerings`)
        .set("Cookie", salesCookie)
        .query({ isActive: "false" });
      expect(salesList.body.data.count).toBe(1);
      expect(salesList.body.data.items[0].name).toBe("Active One");
    });

    it("returns 404 OFFERING_NOT_FOUND for an unknown offering", async () => {
      const user = await makeUser({ role: "sales" });
      const cookie = await signIn(app, user.email);
      const res = await request(app)
        .get(`${API_PREFIX}/offerings/22222222-2222-4222-8222-222222222222`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("OFFERING_NOT_FOUND");
    });

    describe("admin-only authorization (6.10)", () => {
      it("forbids a sales user from POST /offerings (403)", async () => {
        const sales = await makeUser({ role: "sales" });
        const cookie = await signIn(app, sales.email);
        const res = await request(app)
          .post(`${API_PREFIX}/offerings`)
          .set("Cookie", cookie)
          .send({ type: "product", name: "Nope" });
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("FORBIDDEN");
      });

      it("forbids a sales user from PATCH /offerings/:id (403)", async () => {
        const sales = await makeUser({ role: "sales" });
        const cookie = await signIn(app, sales.email);
        const offering = await makeOffering();
        const res = await request(app)
          .patch(`${API_PREFIX}/offerings/${offering.id}`)
          .set("Cookie", cookie)
          .send({ name: "Hacked" });
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("FORBIDDEN");
      });

      it("forbids a sales user from DELETE /offerings/:id (403)", async () => {
        const sales = await makeUser({ role: "sales" });
        const cookie = await signIn(app, sales.email);
        const offering = await makeOffering();
        const res = await request(app)
          .delete(`${API_PREFIX}/offerings/${offering.id}`)
          .set("Cookie", cookie);
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("FORBIDDEN");
      });

      it("allows a sales user to GET offerings", async () => {
        const sales = await makeUser({ role: "sales" });
        const cookie = await signIn(app, sales.email);
        const res = await request(app)
          .get(`${API_PREFIX}/offerings`)
          .set("Cookie", cookie);
        expect(res.status).toBe(200);
      });
    });
  });

  describe("event-offering assignment (dynamic, Decision A)", () => {
    it("rejects unauthenticated access with 401", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const res = await request(app).get(`${API_PREFIX}/events/${event.id}/offerings`);
      expect(res.status).toBe(401);
    });

    it("assigns (201), lists (200), records assignedBy, and removes by eventOfferingId (200)", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      const assigned = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: offering.id });
      expect(assigned.status).toBe(201);
      expect(assigned.body.data.offeringId).toBe(offering.id);
      expect(assigned.body.data.assignedBy).toBe(owner.id);
      const eventOfferingId = assigned.body.data.id;

      const list = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie);
      expect(list.status).toBe(200);
      expect(list.body.data.items).toHaveLength(1);

      const removed = await request(app)
        .delete(`${API_PREFIX}/events/${event.id}/offerings/${eventOfferingId}`)
        .set("Cookie", cookie);
      expect(removed.status).toBe(200);

      const after = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie);
      expect(after.body.data.items).toHaveLength(0);
    });

    it("allows assign AND remove after launch (no lock)", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id, { status: "active" });
      const offering = await makeOffering();

      const assigned = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: offering.id });
      expect(assigned.status).toBe(201);
      const eventOfferingId = assigned.body.data.id;

      const removed = await request(app)
        .delete(`${API_PREFIX}/events/${event.id}/offerings/${eventOfferingId}`)
        .set("Cookie", cookie);
      expect(removed.status).toBe(200);
    });

    it("rejects assigning an inactive offering with 409 OFFERING_INACTIVE", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering({ isActive: false });

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: offering.id });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("OFFERING_INACTIVE");
    });

    it("rejects a duplicate assignment with 409 DUPLICATE_EVENT_OFFERING", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: offering.id });
      const dup = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: offering.id });
      expect(dup.status).toBe(409);
      expect(dup.body.code).toBe("DUPLICATE_EVENT_OFFERING");
    });

    it("returns 404 EVENT_OFFERING_NOT_ASSIGNED removing an unknown row", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .delete(
          `${API_PREFIX}/events/${event.id}/offerings/22222222-2222-4222-8222-222222222222`,
        )
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("EVENT_OFFERING_NOT_ASSIGNED");
    });

    it("rejects a non-owner with 403", async () => {
      const owner = await makeUser({ role: "sales" });
      const stranger = await makeUser({ role: "sales" });
      const cookie = await signIn(app, stranger.email);
      const event = await makeSalesEvent(owner.id);
      const offering = await makeOffering();

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: offering.id });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EVENT_FORBIDDEN");
    });

    it("rejects an unknown event with 404 EVENT_NOT_FOUND", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const res = await request(app)
        .get(`${API_PREFIX}/events/22222222-2222-4222-8222-222222222222/offerings`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("EVENT_NOT_FOUND");
    });

    it("rejects an invalid assign body with 400 VALIDATION_ERROR", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/offerings`)
        .set("Cookie", cookie)
        .send({ offeringId: "nope" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
