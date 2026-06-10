import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";
import { DiscountCalculator } from "@vulkan/lib/services/discount-calculator.service";
import type { OfferingTypeValue } from "@vulkan/lib/services/discount-calculator.service.types";
import type { DiscountPreview } from "@vulkan/lib/services/discount-preview.service.types";
import { EligibilityService } from "@vulkan/lib/services/eligibility.service";
import { EligibilityReason } from "@vulkan/lib/services/eligibility.service.constants";
import { EventOfferingsService } from "@vulkan/lib/services/event-offerings.service";

export const DiscountPreviewService = {
  async preview(
    token: string,
    offeringIds: string[],
  ): Promise<DiscountPreview> {
    const resolution = await InvitationsRepository.findByToken(token);

    if (!resolution) {
      throw EligibilityService.toError(EligibilityReason.INVALID_TOKEN);
    }

    await EventOfferingsService.assertOfferingsSelectable(
      resolution.event.id,
      offeringIds,
    );

    const offerings = await OfferingsRepository.listByIdsWithPrice(offeringIds);

    const selections = offerings.map((offering) => ({
      offeringId: offering.offeringId,
      name: offering.name,
      type: offering.type as OfferingTypeValue,
      basePrice: offering.basePrice,
    }));

    const result = DiscountCalculator.calculate(selections);

    return {
      services: {
        count: result.serviceCount,
        subtotal: result.serviceSubtotal,
        discountPercentage: result.serviceDiscountPercentage,
        discountAmount: result.serviceDiscountAmount,
        totalAfterDiscount: result.serviceTotalAfterDiscount,
      },
      products: {
        count: result.productCount,
        subtotal: result.productSubtotal,
        discountPercentage: result.productDiscountPercentage,
        discountAmount: result.productDiscountAmount,
        totalAfterDiscount: result.productTotalAfterDiscount,
      },
      totalBeforeDiscount: result.totalBeforeDiscount,
      totalDiscountAmount: result.totalDiscountAmount,
      totalAfterDiscount: result.totalAfterDiscount,
    };
  },
};
