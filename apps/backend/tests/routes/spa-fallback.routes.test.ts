import { ApiRouter } from "@vulkan/app/api.router";
import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import express, { type Express } from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const INDEX_HTML = "<!doctype html><html><body><div id=\"root\"></div></body></html>";

function createServedClientApp(clientDir: string): Express {
  const app = express();

  app.use(API_PREFIX, ApiRouter);

  app.use(express.static(clientDir));
  app.use((request, response, next) => {
    if (
      request.method === "GET" &&
      (request.headers.accept ?? "").includes("text/html")
    ) {
      response.sendFile(path.join(clientDir, "index.html"));
      return;
    }
    next();
  });

  return app;
}

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("SPA fallback + API not-found", () => {
  describe("unknown API route under the prefix", () => {
    it("returns a 404 JSON envelope, not HTML", async () => {
      const app = createTestApp();

      const res = await request(app)
        .get(`${API_PREFIX}/does-not-exist`)
        .set("Accept", "application/json");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.text).not.toContain("<html");
    });

    it("returns the JSON 404 even when the client asks for HTML", async () => {
      const app = createTestApp();

      const res = await request(app)
        .get(`${API_PREFIX}/does-not-exist`)
        .set("Accept", "text/html");

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.headers["content-type"]).toContain("application/json");
    });
  });

  describe("non-API path with the SPA served", () => {
    let clientDir: string;

    beforeEach(() => {
      clientDir = fs.mkdtempSync(path.join(os.tmpdir(), "vulkan-spa-"));
      fs.writeFileSync(path.join(clientDir, "index.html"), INDEX_HTML);
    });

    afterEach(() => {
      fs.rmSync(clientDir, { recursive: true, force: true });
    });

    it("serves index.html for an unknown non-API HTML route, not a JSON API 404", async () => {
      const app = createServedClientApp(clientDir);

      const res = await request(app)
        .get("/dashboard/events")
        .set("Accept", "text/html");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
      expect(res.text).toContain("<html");
      expect(res.body.code).toBeUndefined();
    });

    it("still serves the API JSON 404 for unknown routes under the prefix", async () => {
      const app = createServedClientApp(clientDir);

      const res = await request(app)
        .get(`${API_PREFIX}/does-not-exist`)
        .set("Accept", "text/html");

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.headers["content-type"]).toContain("application/json");
    });
  });
});
