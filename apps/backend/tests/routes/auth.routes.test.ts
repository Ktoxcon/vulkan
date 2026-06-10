import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { createRootUser } from "@vulkan/lib/db/create-root";
import { UsersRepository } from "@vulkan/lib/repositories/users.repo";
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

describe("auth + users routes", () => {
  describe("POST /auth/session", () => {
    it("returns 400 VALIDATION_ERROR for an invalid body", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/session`)
        .send({ email: "not-an-email", password: "short" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 INVALID_CREDENTIALS for an unknown user", async () => {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/session`)
        .send({ email: "nobody@vulkan.com", password: "password123" });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 INVALID_CREDENTIALS for a wrong password", async () => {
      await makeUser({ email: "sales@vulkan.com", password: "correct-password" });

      const res = await request(app)
        .post(`${API_PREFIX}/auth/session`)
        .send({ email: "sales@vulkan.com", password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 200 and an HttpOnly session cookie on success", async () => {
      await makeUser({ email: "sales@vulkan.com", password: "correct-password" });

      const res = await request(app)
        .post(`${API_PREFIX}/auth/session`)
        .send({ email: "sales@vulkan.com", password: "correct-password" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers["set-cookie"] as unknown as string[];
      expect(cookies.some((c) => c.startsWith("session="))).toBe(true);
      expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
    });
  });

  describe("DELETE /auth/session", () => {
    it("clears the session cookie and returns 200", async () => {
      const res = await request(app).delete(`${API_PREFIX}/auth/session`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /auth/me", () => {
    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get(`${API_PREFIX}/auth/me`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 200 with the current user for a valid session", async () => {
      const user = await makeUser({
        email: "sales@vulkan.com",
        password: "correct-password",
      });
      const cookie = await signIn(app, "sales@vulkan.com", "correct-password");

      const res = await request(app).get(`${API_PREFIX}/auth/me`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        userRole: user.role,
      });
      expect(res.body.data.passwordHash).toBeUndefined();
    });
  });

  describe("ownership / admin gating on /users", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app).get(`${API_PREFIX}/users`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects a non-admin (sales) with 403", async () => {
      await makeUser({ email: "sales@vulkan.com", password: "correct-password" });
      const cookie = await signIn(app, "sales@vulkan.com", "correct-password");

      const res = await request(app).get(`${API_PREFIX}/users`).set("Cookie", cookie);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("allows the root admin to list users", async () => {
      await createRootUser();
      const cookie = await signIn(app, "root@vulkan.com", "toor1234!@");

      const res = await request(app).get(`${API_PREFIX}/users`).set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });

    it("admin creates a user (201) and rejects a duplicate (409 USER_ALREADY_EXISTS)", async () => {
      await createRootUser();
      const cookie = await signIn(app, "root@vulkan.com", "toor1234!@");

      const payload = {
        email: "new@vulkan.com",
        name: "New",
        lastName: "User",
        userRole: "sales",
        password: "password123",
      };

      const created = await request(app)
        .post(`${API_PREFIX}/users`)
        .set("Cookie", cookie)
        .send(payload);
      expect(created.status).toBe(201);
      expect(created.body.data.email).toBe("new@vulkan.com");
      expect(created.body.data.passwordHash).toBeUndefined();

      const dup = await request(app)
        .post(`${API_PREFIX}/users`)
        .set("Cookie", cookie)
        .send(payload);
      expect(dup.status).toBe(409);
      expect(dup.body.code).toBe("USER_ALREADY_EXISTS");
    });
  });

  describe("createRootUser", () => {
    it("is idempotent (seeds once, no-op thereafter)", async () => {
      const first = await createRootUser();
      const second = await createRootUser();
      expect(first).toBe(second);
      const all = await UsersRepository.list();
      expect(all.count).toBe(1);
    });
  });
});
