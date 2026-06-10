import {
  InvalidPortfolioTransitionError,
  PortfolioAccessDeniedError,
  PortfolioNotFoundError,
} from "@vulkan/errors/portfolio.errors";
import { UserRoles } from "@vulkan/lib/constants/roles";
import {
  PortfolioStatus,
  PortfolioTransitions,
} from "@vulkan/lib/constants/portfolio-status";
import type { PortfolioStatus as PortfolioStatusValue } from "@vulkan/lib/constants/portfolio-status.types";
import { db } from "@vulkan/lib/db/index";
import type { Portfolio } from "@vulkan/lib/db/schema/portfolios.types";
import { PortfolioItemsRepository } from "@vulkan/lib/repositories/portfolio-items.repo";
import { PortfolioStatusEventsRepository } from "@vulkan/lib/repositories/portfolio-status-events.repo";
import { PortfoliosRepository } from "@vulkan/lib/repositories/portfolios.repo";
import type {
  PortfolioListRow,
  PortfolioStatusTimestamps,
} from "@vulkan/lib/repositories/portfolios.repo.types";
import type {
  PortfolioActor,
  PortfolioDetailWithItems,
} from "@vulkan/lib/services/portfolio.service.types";

export const PortfolioService = {
  async listByEvent(eventId: string): Promise<PortfolioListRow[]> {
    return PortfoliosRepository.listByEvent(eventId);
  },

  async getDetail(portfolioId: string): Promise<PortfolioDetailWithItems> {
    const detail = await PortfoliosRepository.getDetail(portfolioId);
    if (!detail) {
      throw new PortfolioNotFoundError();
    }
    const items = await PortfolioItemsRepository.listByPortfolio(portfolioId);
    return { ...detail, items };
  },

  async updateStatus(
    portfolio: Portfolio,
    toStatus: PortfolioStatusValue,
    actor: PortfolioActor,
  ): Promise<Portfolio> {
    const allowed: readonly PortfolioStatusValue[] =
      PortfolioTransitions[portfolio.status as PortfolioStatusValue];
    if (!allowed.includes(toStatus)) {
      throw new InvalidPortfolioTransitionError(
        portfolio.status,
        toStatus,
        allowed,
      );
    }

    const now = new Date();
    const timestamps = PortfolioService.statusTimestamps(toStatus, actor, now);

    return db.transaction(async (tx) => {
      const updated = await PortfoliosRepository.setStatus(
        portfolio.id,
        { toStatus, timestamps },
        tx,
      );

      await PortfolioStatusEventsRepository.create(
        {
          portfolioId: portfolio.id,
          fromStatus: portfolio.status,
          toStatus,
          changedBy: actor.id,
        },
        tx,
      );

      return updated as Portfolio;
    });
  },

  statusTimestamps(
    toStatus: PortfolioStatusValue,
    actor: PortfolioActor,
    now: Date,
  ): PortfolioStatusTimestamps {
    switch (toStatus) {
      case PortfolioStatus.REVIEWED:
        return { reviewedAt: now, reviewedBy: actor.id };
      case PortfolioStatus.SENT:
        return { sentAt: now };
      case PortfolioStatus.ACCEPTED:
        return { acceptedAt: now };
      case PortfolioStatus.REJECTED:
        return { rejectedAt: now };
      case PortfolioStatus.CLOSED:
        return { closedAt: now };
      default:
        return {};
    }
  },

  assertCanAccess(portfolio: Portfolio, actor: PortfolioActor): void {
    if (actor.role === UserRoles.ADMIN) return;
    if (portfolio.ownerId === actor.id) return;
    throw new PortfolioAccessDeniedError();
  },
};
