import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { PortfoliosRepository } from "@vulkan/lib/repositories/portfolios.repo";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { makeOffering } from "@tests/fixtures/offerings";
import {
  seedConfirmReady,
  SingleDayStart,
} from "@tests/fixtures/portfolios";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vulkan/lib/queue/owner-notification.queue", () => ({
  getOwnerNotificationQueue: () => ({ add: async () => undefined }),
}));

let testDb: TestDb;
let app: Express;

beforeEach(async () => {
  testDb = await createTestDb();
  app = createTestApp();
});

afterEach(async () => {
  await testDb.close();
});

describe("public discount-preview route (story 5.1, NO AuthMiddleware)", () => {
  describe("happy path", () => {
    it("returns the spec preview JSON for a mixed basket", async () => {
      const seed = await seedConfirmReady();

      const res = await request(app)
        .post(`${API_PREFIX}/invitations/${seed.invitation.token}/discount-preview`)
        .send({ offeringIds: seed.offeringIds });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.services).toMatchObject({
        count: 2,
        subtotal: "1700.00",
        discountPercentage: 5,
        discountAmount: "85.00",
        totalAfterDiscount: "1615.00",
      });
      expect(res.body.data.products).toMatchObject({
        count: 3,
        subtotal: "300.00",
        discountPercentage: 3,
        discountAmount: "9.00",
        totalAfterDiscount: "291.00",
      });
      expect(res.body.data.totalBeforeDiscount).toBe("2000.00");
      expect(res.body.data.totalDiscountAmount).toBe("94.00");
      expect(res.body.data.totalAfterDiscount).toBe("1906.00");
    });

    it("equals what confirmation stores on the portfolio", async () => {
      const seed = await seedConfirmReady();

      const preview = await request(app)
        .post(`${API_PREFIX}/invitations/${seed.invitation.token}/discount-preview`)
        .send({ offeringIds: seed.offeringIds });

      const confirmed = await request(app)
        .post(`${API_PREFIX}/invitations/${seed.invitation.token}/confirmation`)
        .send({
          firstName: "Grace",
          lastName: "Hopper",
          email: seed.client.email,
          attendanceDate: SingleDayStart,
          offeringIds: seed.offeringIds,
        });
      expect(confirmed.status).toBe(201);

      const portfolio = await PortfoliosRepository.findByConfirmationId(
        confirmed.body.data.confirmationId,
      );

      expect(preview.body.data.totalAfterDiscount).toBe(
        portfolio!.totalAfterDiscount,
      );
      expect(preview.body.data.totalDiscountAmount).toBe(
        portfolio!.totalDiscountAmount,
      );
      expect(preview.body.data.services.discountAmount).toBe(
        portfolio!.serviceDiscountAmount,
      );
      expect(preview.body.data.products.discountAmount).toBe(
        portfolio!.productDiscountAmount,
      );
    });
  });

  describe("validation and errors", () => {
    it("400 when offeringIds is empty", async () => {
      const seed = await seedConfirmReady();
      const res = await request(app)
        .post(`${API_PREFIX}/invitations/${seed.invitation.token}/discount-preview`)
        .send({ offeringIds: [] });
      expect(res.status).toBe(400);
    });

    it("rejects an offering not assigned/active for the event", async () => {
      const seed = await seedConfirmReady();
      const stray = await makeOffering({
        type: OfferingType.PRODUCT,
        basePrice: "50.00",
      });

      const res = await request(app)
        .post(`${API_PREFIX}/invitations/${seed.invitation.token}/discount-preview`)
        .send({ offeringIds: [...seed.offeringIds, stray.id] });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("OFFERING_NOT_SELECTABLE");
    });

    it("rejects an invalid token", async () => {
      const seed = await seedConfirmReady();
      const res = await request(app)
        .post(`${API_PREFIX}/invitations/${"f".repeat(43)}/discount-preview`)
        .send({ offeringIds: seed.offeringIds });
      expect(res.body.success).toBe(false);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("never persists a portfolio", async () => {
      const seed = await seedConfirmReady();
      await request(app)
        .post(`${API_PREFIX}/invitations/${seed.invitation.token}/discount-preview`)
        .send({ offeringIds: seed.offeringIds });

      const list = await PortfoliosRepository.listByEvent(seed.event.id);
      expect(list).toHaveLength(0);
    });
  });
});
