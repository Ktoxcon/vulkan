import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { validEmailTemplateBody } from "@tests/fixtures/email-templates";
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

describe("email-template routes (3.5)", () => {
  describe("POST /events/:eventId/email-template", () => {
    it("401 when unauthenticated", async () => {
      const owner = await makeUser({ role: "sales" });
      const event = await makeSalesEvent(owner.id);
      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .send(validEmailTemplateBody);
      expect(res.status).toBe(401);
    });

    it("403 for a non-owner", async () => {
      const owner = await makeUser({ role: "sales" });
      const stranger = await makeUser({ role: "sales" });
      const cookie = await signIn(app, stranger.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);
      expect(res.status).toBe(403);
    });

    it("201 creates the template", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(validEmailTemplateBody.name);
    });

    it("409 EMAIL_TEMPLATE_ALREADY_EXISTS on a second create", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);
      const again = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);
      expect(again.status).toBe(409);
      expect(again.body.code).toBe("EMAIL_TEMPLATE_ALREADY_EXISTS");
    });

    it("409 EMAIL_TEMPLATE_LOCKED when the event is not Draft", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id, {
        status: EventStatus.ACTIVE,
      });

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EMAIL_TEMPLATE_LOCKED");
    });

    it("400 VALIDATION_ERROR on an empty body", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send({ name: "" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /events/:eventId/email-template", () => {
    it("404 EMAIL_TEMPLATE_NOT_FOUND when none exists", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("EMAIL_TEMPLATE_NOT_FOUND");
    });

    it("returns the single template for the event", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);
      await request(app)
        .patch(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send({ subject: "edited subject" });

      const current = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie);
      expect(current.status).toBe(200);
      expect(current.body.data.subject).toBe("edited subject");
      expect(current.body.data.name).toBe(validEmailTemplateBody.name);
    });
  });

  describe("PATCH /events/:eventId/email-template (edit in place)", () => {
    it("updates the template in place, merging unspecified fields", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      const created = await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);

      const patched = await request(app)
        .patch(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send({ name: "Renamed" });
      expect(patched.status).toBe(200);
      expect(patched.body.data.id).toBe(created.body.data.id);
      expect(patched.body.data.name).toBe("Renamed");
      expect(patched.body.data.subject).toBe(validEmailTemplateBody.subject);

      const current = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie);
      expect(current.body.data.name).toBe("Renamed");
    });
  });

  describe("GET /events/:eventId/email-template/preview", () => {
    it("renders placeholders with sample + event data", async () => {
      const owner = await makeUser({ role: "sales" });
      const cookie = await signIn(app, owner.email);
      const event = await makeSalesEvent(owner.id);

      await request(app)
        .post(`${API_PREFIX}/events/${event.id}/email-template`)
        .set("Cookie", cookie)
        .send(validEmailTemplateBody);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${event.id}/email-template/preview`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.subject).toContain(event.name);
      expect(res.body.data.subject).not.toContain("{{");
      expect(res.body.data.htmlBody).toContain(event.name);
      expect(res.body.data.variables.eventName).toBe(event.name);
    });
  });
});
