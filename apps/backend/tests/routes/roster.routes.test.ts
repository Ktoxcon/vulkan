import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { buildRosterCsv } from "@tests/helpers/csv-buffer";
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

const csvType = "text/csv";

function attachCsv(req: request.Test, buffer: Buffer) {
  return req.attach("file", buffer, {
    filename: "roster.csv",
    contentType: csvType,
  });
}

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("roster routes", () => {
  describe("POST /events/:eventId/roster-imports (3.1/3.2)", () => {
    it("401 when unauthenticated", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const res = await attachCsv(
        request(app).post(`${API_PREFIX}/events/${event.id}/roster-imports`),
        buildRosterCsv([{ name: "A", email: "a@email.com", company: "Acme" }]),
      );
      expect(res.status).toBe(401);
    });

    it("403 when a non-owner uploads", async () => {
      const owner = await makeUser({ role: "sales" });
      const stranger = await makeUser({ role: "sales" });
      const cookie = await signIn(app, stranger.email);
      const event = await makeSalesEvent(owner.id);

      const res = await attachCsv(
        request(app)
          .post(`${API_PREFIX}/events/${event.id}/roster-imports`)
          .set("Cookie", cookie),
        buildRosterCsv([{ name: "A", email: "a@email.com", company: "Acme" }]),
      );
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EVENT_FORBIDDEN");
    });

    it("201 returns a preview with classification counts", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await attachCsv(
        request(app)
          .post(`${API_PREFIX}/events/${event.id}/roster-imports`)
          .set("Cookie", cookie),
        buildRosterCsv([
          { name: "John", email: "john@email.com", company: "Acme" },
          { name: "", email: "bad@email.com", company: "X" },
          { name: "Dup", email: "john@email.com", company: "Y" },
        ]),
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        status: "pending",
        importedCount: 3,
        acceptedCount: 1,
        invalidCount: 1,
        duplicateCount: 1,
      });
      expect(res.body.data.id).toBeTruthy();
    });

    it("400 ROSTER_FILE_MISSING when no file is attached", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-imports`)
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("ROSTER_FILE_MISSING");
    });

    it("400 ROSTER_FILE_TYPE_INVALID for a non-CSV mime type", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-imports`)
        .set("Cookie", cookie)
        .attach("file", Buffer.from("{}"), {
          filename: "roster.json",
          contentType: "application/json",
        });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("ROSTER_FILE_TYPE_INVALID");
    });

    it("409 EVENT_LOCKED_FOR_ROSTER once the event leaves Draft", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id, {
        status: EventStatus.ACTIVE,
      });

      const res = await attachCsv(
        request(app)
          .post(`${API_PREFIX}/events/${event.id}/roster-imports`)
          .set("Cookie", cookie),
        buildRosterCsv([{ name: "A", email: "a@email.com", company: "Acme" }]),
      );
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_LOCKED_FOR_ROSTER");
    });
  });

  describe("GET /events/:eventId/roster-imports/:importId (3.2)", () => {
    it("returns the persisted preview", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const created = await attachCsv(
        request(app)
          .post(`${API_PREFIX}/events/${event.id}/roster-imports`)
          .set("Cookie", cookie),
        buildRosterCsv([{ name: "A", email: "a@email.com", company: "Acme" }]),
      );
      const importId = created.body.data.id;

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/roster-imports/${importId}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(importId);
    });

    it("404 IMPORT_RECORD_NOT_FOUND for an unknown import", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .get(
          `${API_PREFIX}/events/${event.id}/roster-imports/22222222-2222-4222-8222-222222222222`,
        )
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("IMPORT_RECORD_NOT_FOUND");
    });
  });

  describe("PATCH /events/:eventId/roster-imports/:importId (3.3 preview->confirm)", () => {
    async function uploadPreview(cookie: string, eventId: string) {
      const created = await attachCsv(
        request(app)
          .post(`${API_PREFIX}/events/${eventId}/roster-imports`)
          .set("Cookie", cookie),
        buildRosterCsv([
          { name: "John", email: "john@email.com", company: "Acme" },
          { name: "Jane", email: "jane@email.com", company: "Globex" },
        ]),
      );
      return created.body.data.id as string;
    }

    it("commits the roster + clients and is queryable by event", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const importId = await uploadPreview(cookie, event.id);

      const confirm = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}/roster-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      expect(confirm.status).toBe(200);
      expect(confirm.body.data.totalClients).toBe(2);

      const roster = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/roster`)
        .set("Cookie", cookie);
      expect(roster.status).toBe(200);
      expect(roster.body.data.clients).toHaveLength(2);
    });

    it("409 IMPORT_RECORD_ALREADY_CONFIRMED on a second confirm (idempotency guard)", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const importId = await uploadPreview(cookie, event.id);

      await request(app)
        .patch(`${API_PREFIX}/events/${event.id}/roster-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      const again = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}/roster-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      expect(again.status).toBe(409);
      expect(again.body.code).toBe("IMPORT_RECORD_ALREADY_CONFIRMED");
    });

    it("400 VALIDATION_ERROR when the body status is not 'confirmed'", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);
      const importId = await uploadPreview(cookie, event.id);

      const res = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}/roster-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "nope" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /events/:eventId/roster (3.3)", () => {
    it("404 ROSTER_NOT_FOUND when no roster has been confirmed", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/roster`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("ROSTER_NOT_FOUND");
    });
  });

  describe("POST /events/:eventId/roster-clients (manual add)", () => {
    const member = { name: "Cassian", email: "cassian@email.com", company: "Forge Co" };

    it("401 when unauthenticated", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .send(member);
      expect(res.status).toBe(401);
    });

    it("403 when a non-owner adds", async () => {
      const owner = await makeUser({ role: "sales" });
      const stranger = await makeUser({ role: "sales" });
      const cookie = await signIn(app, stranger.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send(member);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EVENT_FORBIDDEN");
    });

    it("201 bootstraps a roster and adds the client when none exists", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send(member);
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: "Cassian",
        email: "cassian@email.com",
        company: "Forge Co",
      });
      expect(res.body.data.rosterClientId).toBeTruthy();

      const roster = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/roster`)
        .set("Cookie", cookie);
      expect(roster.status).toBe(200);
      expect(roster.body.data.clients).toHaveLength(1);
      expect(roster.body.data.roster.totalClients).toBe(1);
    });

    it("201 appends, increments totalClients, lowercases email and nulls empty company", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send(member);
      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send({ name: "Numeon", email: "NUMEON@email.com", company: "" });
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe("numeon@email.com");
      expect(res.body.data.company).toBeNull();

      const roster = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/roster`)
        .set("Cookie", cookie);
      expect(roster.body.data.clients).toHaveLength(2);
      expect(roster.body.data.roster.totalClients).toBe(2);
    });

    it("409 ROSTER_CLIENT_DUPLICATE when the email is already on the roster", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send(member);
      const again = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send({ ...member, name: "Cassian Vaughn" });
      expect(again.status).toBe(409);
      expect(again.body.code).toBe("ROSTER_CLIENT_DUPLICATE");
    });

    it("409 EVENT_LOCKED_FOR_ROSTER when the event is not Draft", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id, {
        status: EventStatus.ACTIVE,
      });

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send(member);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EVENT_LOCKED_FOR_ROSTER");
    });

    it("400 VALIDATION_ERROR for an invalid email", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/roster-clients`)
        .set("Cookie", cookie)
        .send({ name: "X", email: "not-an-email", company: "" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
