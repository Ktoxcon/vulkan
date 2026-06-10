import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import type { Portfolio } from "@vulkan/lib/db/schema/portfolios.types";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { PortfolioExportService } from "@vulkan/lib/services/portfolio-export.service";
import { PortfolioService } from "@vulkan/lib/services/portfolio.service";
import type { PortfolioActor } from "@vulkan/lib/services/portfolio.service.types";
import { PortfolioStatusBodySchema } from "@vulkan/lib/validators/portfolio.schemas";
import type { Request, Response } from "express";

export const PortfoliosController = {
  list: withErrorHandling(async (_request: Request, response: Response) => {
    const event = response.locals.event as SalesEvent;

    const data = await PortfolioService.listByEvent(event.id);

    response.status(200).send({ success: true, data });
  }),

  detail: withErrorHandling(async (_request: Request, response: Response) => {
    const portfolio = response.locals.portfolio as Portfolio;

    const data = await PortfolioService.getDetail(portfolio.id);

    response.status(200).send({ success: true, data });
  }),

  updateStatus: withErrorHandling(
    async (request: Request, response: Response) => {
      const portfolio = response.locals.portfolio as Portfolio;
      const actor = response.locals.actor as PortfolioActor;
      const { status } = PortfolioStatusBodySchema.parse(request.body);

      const data = await PortfolioService.updateStatus(
        portfolio,
        status,
        actor,
      );

      response.status(200).send({ success: true, data });
    },
  ),

  export: withErrorHandling(async (_request: Request, response: Response) => {
    const portfolio = response.locals.portfolio as Portfolio;

    const csv = await PortfolioExportService.toCsv(portfolio.id);

    response.status(200);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="portfolio-${portfolio.id}.csv"`,
    );
    response.send(csv);
  }),
};
