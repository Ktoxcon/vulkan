import { PortfolioStatus } from "@vulkan/lib/constants/portfolio-status";
import type { Portfolio } from "@vulkan/lib/db/schema/portfolios.types";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import { PortfolioItemsRepository } from "@vulkan/lib/repositories/portfolio-items.repo";
import { PortfolioStatusEventsRepository } from "@vulkan/lib/repositories/portfolio-status-events.repo";
import { PortfoliosRepository } from "@vulkan/lib/repositories/portfolios.repo";
import { DiscountCalculator } from "@vulkan/lib/services/discount-calculator.service";
import type { OfferingTypeValue } from "@vulkan/lib/services/discount-calculator.service.types";
import type { PortfolioGenerationArgs } from "@vulkan/lib/services/portfolio-generation.service.types";

export const PortfolioGenerationService = {
  async generate(
    args: PortfolioGenerationArgs,
    executor: DbExecutor,
  ): Promise<Portfolio> {
    const existing = await PortfoliosRepository.findByConfirmationId(
      args.confirmationId,
      executor,
    );

    if (existing) {
      return existing;
    }

    const offerings = await OfferingsRepository.listByIdsWithPrice(
      args.offeringIds,
      executor,
    );

    const selections = offerings.map((offering) => ({
      offeringId: offering.offeringId,
      name: offering.name,
      type: offering.type as OfferingTypeValue,
      basePrice: offering.basePrice,
    }));

    const totals = DiscountCalculator.calculate(selections);
    const items = DiscountCalculator.buildItems(selections);

    const portfolio = await PortfoliosRepository.create(
      {
        eventId: args.event.id,
        clientId: args.client.id,
        attendanceConfirmationId: args.confirmationId,
        ownerId: args.ownerId,
        status: PortfolioStatus.DRAFT,
        serviceSubtotal: totals.serviceSubtotal,
        serviceDiscountPercentage: totals.serviceDiscountPercentage,
        serviceDiscountAmount: totals.serviceDiscountAmount,
        serviceTotalAfterDiscount: totals.serviceTotalAfterDiscount,
        productSubtotal: totals.productSubtotal,
        productDiscountPercentage: totals.productDiscountPercentage,
        productDiscountAmount: totals.productDiscountAmount,
        productTotalAfterDiscount: totals.productTotalAfterDiscount,
        totalBeforeDiscount: totals.totalBeforeDiscount,
        totalDiscountAmount: totals.totalDiscountAmount,
        totalAfterDiscount: totals.totalAfterDiscount,
      },
      executor,
    );

    await PortfolioItemsRepository.createMany(
      portfolio.id,
      items.map((item) => ({
        offeringId: item.offeringId,
        offeringName: item.offeringName,
        offeringType: item.offeringType,
        basePrice: item.basePrice,
        discountPercentage: item.discountPercentage,
        discountAmount: item.discountAmount,
        finalPrice: item.finalPrice,
      })),
      executor,
    );

    await PortfolioStatusEventsRepository.create(
      {
        portfolioId: portfolio.id,
        fromStatus: null,
        toStatus: PortfolioStatus.DRAFT,
        changedBy: args.ownerId,
      },
      executor,
    );

    return portfolio;
  },
};
