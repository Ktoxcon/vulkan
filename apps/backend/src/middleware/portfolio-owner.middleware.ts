import { PortfolioNotFoundError } from "@vulkan/errors/portfolio.errors";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { PortfoliosRepository } from "@vulkan/lib/repositories/portfolios.repo";
import { PortfolioService } from "@vulkan/lib/services/portfolio.service";
import type { PortfolioActor } from "@vulkan/lib/services/portfolio.service.types";
import { PortfolioIdParamSchema } from "@vulkan/lib/validators/portfolio.schemas";
import type { NextFunction, Request, Response } from "express";

export const PortfolioOwnerMiddleware = withErrorHandling(
  async (request: Request, response: Response, next: NextFunction) => {
    const { data } = response.locals.session as {
      data: { id: string; userRole: string };
    };
    const actor: PortfolioActor = { id: data.id, role: data.userRole };

    const portfolioId = PortfolioIdParamSchema.parse(
      request.params.portfolioId,
    );

    const portfolio = await PortfoliosRepository.findById(portfolioId);

    if (!portfolio) {
      throw new PortfolioNotFoundError();
    }

    PortfolioService.assertCanAccess(portfolio, actor);

    response.locals.portfolio = portfolio;
    response.locals.actor = actor;

    next();
  },
);
