import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { makeOffering } from "@tests/fixtures/offerings";
import { makeUser } from "@tests/fixtures/users";
import { buildOfferingCsv } from "@tests/helpers/csv-buffer";
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
    filename: "offerings.csv",
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

describe("offering-imports routes (6.5)", () => {
  describe("POST /offering-imports (preview)", () => {
    it("401 when unauthenticated", async () => {
      const res = await attachCsv(
        request(app).post(`${API_PREFIX}/offering-imports`),
        buildOfferingCsv([
          { name: "A", type: "product", basePrice: "10" },
        ]),
      );
      expect(res.status).toBe(401);
    });

    it("403 for a sales user (admin-only)", async () => {
      const sales = await makeUser({ role: "sales" });
      const cookie = await signIn(app, sales.email);
      const res = await attachCsv(
        request(app).post(`${API_PREFIX}/offering-imports`).set("Cookie", cookie),
        buildOfferingCsv([
          { name: "A", type: "product", basePrice: "10" },
        ]),
      );
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("400 OFFERING_IMPORT_FILE_MISSING with no file", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      const res = await request(app)
        .post(`${API_PREFIX}/offering-imports`)
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("OFFERING_IMPORT_FILE_MISSING");
    });

    it("previews and classifies valid / invalid / duplicate rows (201, pending)", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      await makeOffering({ type: "product", name: "Existing Catalog" });

      const csv = buildOfferingCsv([
        { name: "Brand New", type: "product", basePrice: "100" },
        { name: "Another New", type: "service", basePrice: "20" },
        { name: "Brand New", type: "product", basePrice: "999" },
        { name: "Existing Catalog", type: "product", basePrice: "5" },
        { name: "", type: "product", basePrice: "10" },
        { name: "Bad Type", type: "widget", basePrice: "10" },
        { name: "Bad Price", type: "service", basePrice: "-3" },
      ]);

      const res = await attachCsv(
        request(app).post(`${API_PREFIX}/offering-imports`).set("Cookie", cookie),
        csv,
      );
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.processedCount).toBe(7);
      expect(res.body.data.importedCount).toBe(0);
      expect(res.body.data.validRows).toHaveLength(2);
      expect(res.body.data.invalidCount).toBe(3);
      expect(res.body.data.duplicateCount).toBe(2);
    });
  });

  describe("GET + PATCH /offering-imports/:importId (confirm)", () => {
    it("fetches a preview then confirms it (partial import, skips duplicates)", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);

      const csv = buildOfferingCsv([
        { name: "Alpha", type: "product", basePrice: "10" },
        { name: "Beta", type: "service", basePrice: "20" },
      ]);
      const preview = await attachCsv(
        request(app).post(`${API_PREFIX}/offering-imports`).set("Cookie", cookie),
        csv,
      );
      expect(preview.status).toBe(201);
      const importId = preview.body.data.id;

      const got = await request(app)
        .get(`${API_PREFIX}/offering-imports/${importId}`)
        .set("Cookie", cookie);
      expect(got.status).toBe(200);
      expect(got.body.data.id).toBe(importId);

      const confirmed = await request(app)
        .patch(`${API_PREFIX}/offering-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      expect(confirmed.status).toBe(200);
      expect(confirmed.body.data.status).toBe("confirmed");
      expect(confirmed.body.data.importedCount).toBe(2);

      const list = await request(app)
        .get(`${API_PREFIX}/offerings`)
        .set("Cookie", cookie)
        .query({ search: "Alpha" });
      expect(list.body.data.count).toBe(1);
    });

    it("skips a row that became a catalog duplicate before confirm (partial import)", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);

      const csv = buildOfferingCsv([
        { name: "Gamma", type: "product", basePrice: "10" },
        { name: "Delta", type: "product", basePrice: "20" },
      ]);
      const preview = await attachCsv(
        request(app).post(`${API_PREFIX}/offering-imports`).set("Cookie", cookie),
        csv,
      );
      const importId = preview.body.data.id;

      await makeOffering({ type: "product", name: "Gamma" });

      const confirmed = await request(app)
        .patch(`${API_PREFIX}/offering-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      expect(confirmed.status).toBe(200);
      expect(confirmed.body.data.importedCount).toBe(1);
      expect(confirmed.body.data.duplicateCount).toBe(1);
    });

    it("409 OFFERING_IMPORT_ALREADY_CONFIRMED on a second confirm", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      const preview = await attachCsv(
        request(app).post(`${API_PREFIX}/offering-imports`).set("Cookie", cookie),
        buildOfferingCsv([
          { name: "Once", type: "product", basePrice: "10" },
        ]),
      );
      const importId = preview.body.data.id;

      await request(app)
        .patch(`${API_PREFIX}/offering-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      const second = await request(app)
        .patch(`${API_PREFIX}/offering-imports/${importId}`)
        .set("Cookie", cookie)
        .send({ status: "confirmed" });
      expect(second.status).toBe(409);
      expect(second.body.code).toBe("OFFERING_IMPORT_ALREADY_CONFIRMED");
    });

    it("404 OFFERING_IMPORT_NOT_FOUND for an unknown import", async () => {
      const admin = await makeUser({ role: "admin" });
      const cookie = await signIn(app, admin.email);
      const res = await request(app)
        .get(`${API_PREFIX}/offering-imports/22222222-2222-4222-8222-222222222222`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("OFFERING_IMPORT_NOT_FOUND");
    });

    it("403 for a sales user on GET (admin-only)", async () => {
      const sales = await makeUser({ role: "sales" });
      const cookie = await signIn(app, sales.email);
      const res = await request(app)
        .get(`${API_PREFIX}/offering-imports/22222222-2222-4222-8222-222222222222`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });
});
