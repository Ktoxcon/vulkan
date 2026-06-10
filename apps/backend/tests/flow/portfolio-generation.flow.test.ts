import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { PortfolioStatus } from "@vulkan/lib/constants/portfolio-status";
import { db } from "@vulkan/lib/db/index";
import { portfolioStatusEvents } from "@vulkan/lib/db/schema/portfolio-status-events";
import { PortfolioItemsRepository } from "@vulkan/lib/repositories/portfolio-items.repo";
import { PortfoliosRepository } from "@vulkan/lib/repositories/portfolios.repo";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import { PortfolioGenerationService } from "@vulkan/lib/services/portfolio-generation.service";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { makeAttendanceConfirmation } from "@tests/fixtures/attendance-confirmations";
import {
  seedConfirmReady,
  SingleDayStart,
} from "@tests/fixtures/portfolios";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { eq } from "drizzle-orm";
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
  vi.restoreAllMocks();
  await testDb.close();
});

async function confirm(token: string, email: string, offeringIds: string[]) {
  return request(app)
    .post(`${API_PREFIX}/invitations/${token}/confirmation`)
    .send({
      firstName: "Grace",
      lastName: "Hopper",
      email,
      attendanceDate: SingleDayStart,
      offeringIds,
    });
}

describe("portfolio generation inside the confirm transaction", () => {
  describe("happy path", () => {
    it("creates exactly one draft portfolio with snapshot items and reconciling totals", async () => {
      const seed = await seedConfirmReady();

      const res = await confirm(
        seed.invitation.token,
        seed.client.email,
        seed.offeringIds,
      );
      expect(res.status).toBe(201);

      const list = await PortfoliosRepository.listByEvent(seed.event.id);
      expect(list).toHaveLength(1);

      const portfolio = await PortfoliosRepository.findByConfirmationId(
        res.body.data.confirmationId,
      );
      expect(portfolio).toBeTruthy();
      expect(portfolio!.status).toBe(PortfolioStatus.DRAFT);
      expect(portfolio!.ownerId).toBe(seed.owner.id);

      const items = await PortfolioItemsRepository.listByPortfolio(
        portfolio!.id,
      );
      expect(items).toHaveLength(seed.offeringIds.length);

      const services = items.filter(
        (item) => item.offeringType === OfferingType.SERVICE,
      );
      const products = items.filter(
        (item) => item.offeringType === OfferingType.PRODUCT,
      );
      expect(services).toHaveLength(2);
      expect(products).toHaveLength(3);

      expect(portfolio!.serviceDiscountPercentage).toBe(5);
      expect(portfolio!.serviceDiscountAmount).toBe("85.00");
      expect(portfolio!.productDiscountPercentage).toBe(3);
      expect(portfolio!.productDiscountAmount).toBe("9.00");
      expect(portfolio!.totalBeforeDiscount).toBe("2000.00");
      expect(portfolio!.totalDiscountAmount).toBe("94.00");
      expect(portfolio!.totalAfterDiscount).toBe("1906.00");

      const itemDiscountSum = items.reduce(
        (total, item) => total + Math.round(Number(item.discountAmount) * 100),
        0,
      );
      expect(itemDiscountSum).toBe(
        Math.round(Number(portfolio!.totalDiscountAmount) * 100),
      );
    });

    it("writes an initial draft audit row (from null -> draft)", async () => {
      const seed = await seedConfirmReady();
      const res = await confirm(
        seed.invitation.token,
        seed.client.email,
        seed.offeringIds,
      );
      const portfolio = await PortfoliosRepository.findByConfirmationId(
        res.body.data.confirmationId,
      );

      const events = await db
        .select()
        .from(portfolioStatusEvents)
        .where(eq(portfolioStatusEvents.portfolioId, portfolio!.id));

      expect(events).toHaveLength(1);
      expect(events[0]!.fromStatus).toBeNull();
      expect(events[0]!.toStatus).toBe(PortfolioStatus.DRAFT);
      expect(events[0]!.changedBy).toBe(seed.owner.id);
    });

    it("snapshots item prices independently of later offering price changes", async () => {
      const seed = await seedConfirmReady([
        { type: OfferingType.PRODUCT, basePrice: "100.00", name: "Frozen" },
        { type: OfferingType.PRODUCT, basePrice: "100.00", name: "Frozen 2" },
        { type: OfferingType.PRODUCT, basePrice: "100.00", name: "Frozen 3" },
      ]);
      const res = await confirm(
        seed.invitation.token,
        seed.client.email,
        seed.offeringIds,
      );
      const portfolio = await PortfoliosRepository.findByConfirmationId(
        res.body.data.confirmationId,
      );
      const before = await PortfolioItemsRepository.listByPortfolio(
        portfolio!.id,
      );

      await OfferingsRepository.update(seed.offeringIds[0]!, {
        basePrice: "9999.00",
      });

      const after = await PortfolioItemsRepository.listByPortfolio(
        portfolio!.id,
      );
      expect(after.map((i) => i.basePrice).sort()).toEqual(
        before.map((i) => i.basePrice).sort(),
      );
      after.forEach((item) => expect(item.basePrice).toBe("100.00"));
    });
  });

  describe("idempotency", () => {
    it("a second generate for the same confirmation does not duplicate the portfolio", async () => {
      const seed = await seedConfirmReady();
      const res = await confirm(
        seed.invitation.token,
        seed.client.email,
        seed.offeringIds,
      );
      const first = await PortfoliosRepository.findByConfirmationId(
        res.body.data.confirmationId,
      );

      const again = await db.transaction((tx) =>
        PortfolioGenerationService.generate(
          {
            event: seed.event,
            client: {
              id: seed.client.id,
              email: seed.client.email,
              name: seed.client.name,
              company: seed.client.company,
            },
            confirmationId: res.body.data.confirmationId,
            ownerId: seed.owner.id,
            offeringIds: seed.offeringIds,
          },
          tx,
        ),
      );

      expect(again.id).toBe(first!.id);
      const list = await PortfoliosRepository.listByEvent(seed.event.id);
      expect(list).toHaveLength(1);
    });
  });

  describe("atomic rollback", () => {
    it("a failure after generation leaves no orphan portfolio", async () => {
      const seed = await seedConfirmReady();

      const spy = vi
        .spyOn(PortfolioGenerationService, "generate")
        .mockRejectedValueOnce(new Error("boom"));

      const res = await confirm(
        seed.invitation.token,
        seed.client.email,
        seed.offeringIds,
      );
      expect(res.status).toBe(500);

      const list = await PortfoliosRepository.listByEvent(seed.event.id);
      expect(list).toHaveLength(0);
      spy.mockRestore();
    });

    it("rolls back the whole confirm tx when a portfolio item insert fails", async () => {
      const seed = await seedConfirmReady();

      const spy = vi
        .spyOn(PortfolioItemsRepository, "createMany")
        .mockRejectedValueOnce(new Error("item boom"));

      const res = await confirm(
        seed.invitation.token,
        seed.client.email,
        seed.offeringIds,
      );
      expect(res.status).toBe(500);

      const portfolios = await PortfoliosRepository.listByEvent(seed.event.id);
      expect(portfolios).toHaveLength(0);
      spy.mockRestore();
    });
  });

  describe("direct generation idempotency guard", () => {
    it("returns existing portfolio when one already exists for the confirmation", async () => {
      const seed = await seedConfirmReady();
      const confirmation = await makeAttendanceConfirmation(
        seed.event.id,
        seed.invitation.id,
        seed.client.id,
        { email: seed.client.email },
      );

      const first = await db.transaction((tx) =>
        PortfolioGenerationService.generate(
          {
            event: seed.event,
            client: {
              id: seed.client.id,
              email: seed.client.email,
              name: seed.client.name,
              company: seed.client.company,
            },
            confirmationId: confirmation.id,
            ownerId: seed.owner.id,
            offeringIds: seed.offeringIds,
          },
          tx,
        ),
      );
      const second = await db.transaction((tx) =>
        PortfolioGenerationService.generate(
          {
            event: seed.event,
            client: {
              id: seed.client.id,
              email: seed.client.email,
              name: seed.client.name,
              company: seed.client.company,
            },
            confirmationId: confirmation.id,
            ownerId: seed.owner.id,
            offeringIds: seed.offeringIds,
          },
          tx,
        ),
      );
      expect(second.id).toBe(first.id);
    });
  });
});
