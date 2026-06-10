import { API_PREFIX } from "@vulkan/lib/constants/api.constants";
import { PortfolioStatus } from "@vulkan/lib/constants/portfolio-status";
import { UserRoles } from "@vulkan/lib/constants/roles";
import { db } from "@vulkan/lib/db/index";
import { portfolioStatusEvents } from "@vulkan/lib/db/schema/portfolio-status-events";
import { PortfoliosRepository } from "@vulkan/lib/repositories/portfolios.repo";
import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import {
  advancePortfolioStatus,
  makeGeneratedPortfolio,
} from "@tests/fixtures/portfolios";
import { makeUser } from "@tests/fixtures/users";
import { signIn } from "@tests/helpers/sign-in";
import { createTestApp } from "@tests/helpers/test-app";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { eq } from "drizzle-orm";
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

describe("portfolio read / transition / export routes", () => {
  describe("GET /events/:eventId/portfolios (story 5.4)", () => {
    it("owner sees their event portfolios with totals", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${seed.eventId}/portfolios`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(seed.portfolio.id);
      expect(res.body.data[0].totalAfterDiscount).toBe("1906.00");
      expect(res.body.data[0].status).toBe(PortfolioStatus.DRAFT);
      expect(res.body.data[0].clientName).toBeTruthy();
    });

    it("admin sees portfolios for any event", async () => {
      const seed = await makeGeneratedPortfolio();
      const admin = await makeUser({ role: UserRoles.ADMIN });
      const cookie = await signIn(app, admin.email);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${seed.eventId}/portfolios`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("401 unauthenticated", async () => {
      const seed = await makeGeneratedPortfolio();
      const res = await request(app).get(`${API_PREFIX}/events/${seed.eventId}/portfolios`);
      expect(res.status).toBe(401);
    });

    it("403 when a sales rep lists another owner's event", async () => {
      const seed = await makeGeneratedPortfolio();
      const intruder = await makeUser({ role: UserRoles.SALES });
      const cookie = await signIn(app, intruder.email);

      const res = await request(app)
        .get(`${API_PREFIX}/events/${seed.eventId}/portfolios`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /portfolios/:portfolioId (story 5.5)", () => {
    it("returns the detail with items", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);

      const res = await request(app)
        .get(`${API_PREFIX}/portfolios/${seed.portfolio.id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(seed.portfolio.id);
      expect(res.body.data.client.name).toBeTruthy();
      expect(res.body.data.event.id).toBe(seed.eventId);
      expect(res.body.data.items).toHaveLength(seed.offeringIds.length);
      expect(res.body.data.totalAfterDiscount).toBe("1906.00");
    });

    it("404 for an unknown portfolio", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);
      const res = await request(app)
        .get(`${API_PREFIX}/portfolios/${"00000000-0000-0000-0000-000000000000"}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("PORTFOLIO_NOT_FOUND");
    });

    it("403 when a sales rep views another owner's portfolio", async () => {
      const seed = await makeGeneratedPortfolio();
      const intruder = await makeUser({ role: UserRoles.SALES });
      const cookie = await signIn(app, intruder.email);
      const res = await request(app)
        .get(`${API_PREFIX}/portfolios/${seed.portfolio.id}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("PORTFOLIO_ACCESS_DENIED");
    });

    it("admin can view any portfolio", async () => {
      const seed = await makeGeneratedPortfolio();
      const admin = await makeUser({ role: UserRoles.ADMIN });
      const cookie = await signIn(app, admin.email);
      const res = await request(app)
        .get(`${API_PREFIX}/portfolios/${seed.portfolio.id}`)
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
    });

    it("401 unauthenticated", async () => {
      const seed = await makeGeneratedPortfolio();
      const res = await request(app).get(`${API_PREFIX}/portfolios/${seed.portfolio.id}`);
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /portfolios/:portfolioId/status (story 5.6)", () => {
    it("draft -> reviewed sets reviewedAt/reviewedBy and writes an audit row", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);

      const res = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.REVIEWED });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(PortfolioStatus.REVIEWED);
      expect(res.body.data.reviewedAt).toBeTruthy();
      expect(res.body.data.reviewedBy).toBe(seed.ownerId);

      const events = await db
        .select()
        .from(portfolioStatusEvents)
        .where(eq(portfolioStatusEvents.portfolioId, seed.portfolio.id));
      const reviewedEvent = events.find(
        (e) => e.toStatus === PortfolioStatus.REVIEWED,
      );
      expect(reviewedEvent).toBeTruthy();
      expect(reviewedEvent!.fromStatus).toBe(PortfolioStatus.DRAFT);
      expect(reviewedEvent!.changedBy).toBe(seed.ownerId);
    });

    it("walks the full legal lifecycle setting each timestamp", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);

      const reviewed = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.REVIEWED });
      expect(reviewed.body.data.reviewedAt).toBeTruthy();

      const sent = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.SENT });
      expect(sent.body.data.sentAt).toBeTruthy();

      const accepted = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.ACCEPTED });
      expect(accepted.body.data.acceptedAt).toBeTruthy();

      const closed = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.CLOSED });
      expect(closed.status).toBe(200);
      expect(closed.body.data.closedAt).toBeTruthy();
    });

    it("sent -> rejected sets rejectedAt", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);
      await advancePortfolioStatus(
        seed.portfolio,
        PortfolioStatus.REVIEWED,
        seed.ownerId,
      );
      const reloaded = await PortfoliosRepository.findById(seed.portfolio.id);
      await advancePortfolioStatus(
        reloaded!,
        PortfolioStatus.SENT,
        seed.ownerId,
      );

      const res = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.REJECTED });
      expect(res.status).toBe(200);
      expect(res.body.data.rejectedAt).toBeTruthy();
    });

    it("409 with allowed-next details on an illegal transition", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);

      const res = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.SENT });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("INVALID_PORTFOLIO_TRANSITION");
      expect(res.body.details.allowed).toEqual([PortfolioStatus.REVIEWED]);
    });

    it("400 on an unknown status value", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);
      const res = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: "archived" });
      expect(res.status).toBe(400);
    });

    it("403 when a sales rep transitions another owner's portfolio", async () => {
      const seed = await makeGeneratedPortfolio();
      const intruder = await makeUser({ role: UserRoles.SALES });
      const cookie = await signIn(app, intruder.email);
      const res = await request(app)
        .patch(`${API_PREFIX}/portfolios/${seed.portfolio.id}/status`)
        .set("Cookie", cookie)
        .send({ status: PortfolioStatus.REVIEWED });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /portfolios/:portfolioId/export (story 5.8)", () => {
    it("returns CSV with client/event/items/totals and the right content-type", async () => {
      const seed = await makeGeneratedPortfolio();
      const cookie = await signIn(app, seed.ownerEmail);

      const res = await request(app)
        .get(`${API_PREFIX}/portfolios/${seed.portfolio.id}/export`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain(
        `portfolio-${seed.portfolio.id}.csv`,
      );

      const csv = res.text;
      expect(csv).toContain("Audit");
      expect(csv).toContain(OfferingType.SERVICE);
      expect(csv).toContain("1906.00");
      expect(csv).toContain("Annual Promo");
    });

    it("403 when a sales rep exports another owner's portfolio", async () => {
      const seed = await makeGeneratedPortfolio();
      const intruder = await makeUser({ role: UserRoles.SALES });
      const cookie = await signIn(app, intruder.email);
      const res = await request(app)
        .get(`${API_PREFIX}/portfolios/${seed.portfolio.id}/export`)
        .set("Cookie", cookie);
      expect(res.status).toBe(403);
    });

    it("401 unauthenticated", async () => {
      const seed = await makeGeneratedPortfolio();
      const res = await request(app).get(
        `${API_PREFIX}/portfolios/${seed.portfolio.id}/export`,
      );
      expect(res.status).toBe(401);
    });
  });
});
