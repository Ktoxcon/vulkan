import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import {
  ProductHighCount,
  ProductHighPct,
  ProductMidCount,
  ProductMidPct,
  ServiceHighPct,
  ServiceMidPct,
  ServiceMinCount,
  ServiceSubtotalThreshold,
} from "@vulkan/lib/services/discount-calculator.service.constants";
import type {
  DiscountCalculationResult,
  DiscountItem,
  DiscountSelection,
} from "@vulkan/lib/services/discount-calculator.service.types";

export const DiscountCalculator = {
  toCents(value: string | number): number {
    return Math.round(Number(value) * 100);
  },

  fromCents(cents: number): string {
    return (cents / 100).toFixed(2);
  },

  applyPercent(cents: number, pct: number): number {
    return Math.round((cents * pct) / 100);
  },

  servicePercentage(count: number, subtotalCents: number): number {
    if (count >= ServiceMinCount && subtotalCents > ServiceSubtotalThreshold) {
      return ServiceHighPct;
    }
    if (count >= ServiceMinCount) {
      return ServiceMidPct;
    }
    return 0;
  },

  productPercentage(count: number): number {
    if (count >= ProductHighCount) {
      return ProductHighPct;
    }
    if (count >= ProductMidCount) {
      return ProductMidPct;
    }
    return 0;
  },

  buildItems(selections: DiscountSelection[]): DiscountItem[] {
    const services = selections.filter((s) => s.type === OfferingType.SERVICE);
    const products = selections.filter((s) => s.type === OfferingType.PRODUCT);

    const serviceSubtotalCents = services.reduce(
      (sum, s) => sum + DiscountCalculator.toCents(s.basePrice),
      0,
    );

    const servicePct = DiscountCalculator.servicePercentage(
      services.length,
      serviceSubtotalCents,
    );
    const productPct = DiscountCalculator.productPercentage(products.length);

    return selections.map((selection) => {
      const baseCents = DiscountCalculator.toCents(selection.basePrice);
      const pct =
        selection.type === OfferingType.SERVICE ? servicePct : productPct;
      const discountCents = DiscountCalculator.applyPercent(baseCents, pct);
      const finalCents = baseCents - discountCents;
      return {
        offeringId: selection.offeringId,
        offeringName: selection.name,
        offeringType: selection.type,
        basePrice: DiscountCalculator.fromCents(baseCents),
        discountPercentage: pct,
        discountAmount: DiscountCalculator.fromCents(discountCents),
        finalPrice: DiscountCalculator.fromCents(finalCents),
      };
    });
  },

  calculate(selections: DiscountSelection[]): DiscountCalculationResult {
    const items = DiscountCalculator.buildItems(selections);

    const serviceItems = items.filter(
      (item) => item.offeringType === OfferingType.SERVICE,
    );
    const productItems = items.filter(
      (item) => item.offeringType === OfferingType.PRODUCT,
    );

    const serviceSubtotalCents = serviceItems.reduce(
      (sum, item) => sum + DiscountCalculator.toCents(item.basePrice),
      0,
    );
    const serviceDiscountCents = serviceItems.reduce(
      (sum, item) => sum + DiscountCalculator.toCents(item.discountAmount),
      0,
    );
    const productSubtotalCents = productItems.reduce(
      (sum, item) => sum + DiscountCalculator.toCents(item.basePrice),
      0,
    );
    const productDiscountCents = productItems.reduce(
      (sum, item) => sum + DiscountCalculator.toCents(item.discountAmount),
      0,
    );

    const serviceTotalAfterCents = serviceSubtotalCents - serviceDiscountCents;
    const productTotalAfterCents = productSubtotalCents - productDiscountCents;
    const totalBeforeCents = serviceSubtotalCents + productSubtotalCents;
    const totalDiscountCents = serviceDiscountCents + productDiscountCents;
    const totalAfterCents = totalBeforeCents - totalDiscountCents;

    return {
      serviceCount: serviceItems.length,
      serviceSubtotal: DiscountCalculator.fromCents(serviceSubtotalCents),
      serviceDiscountPercentage: DiscountCalculator.servicePercentage(
        serviceItems.length,
        serviceSubtotalCents,
      ),
      serviceDiscountAmount: DiscountCalculator.fromCents(serviceDiscountCents),
      serviceTotalAfterDiscount:
        DiscountCalculator.fromCents(serviceTotalAfterCents),
      productCount: productItems.length,
      productSubtotal: DiscountCalculator.fromCents(productSubtotalCents),
      productDiscountPercentage: DiscountCalculator.productPercentage(
        productItems.length,
      ),
      productDiscountAmount: DiscountCalculator.fromCents(productDiscountCents),
      productTotalAfterDiscount:
        DiscountCalculator.fromCents(productTotalAfterCents),
      totalBeforeDiscount: DiscountCalculator.fromCents(totalBeforeCents),
      totalDiscountAmount: DiscountCalculator.fromCents(totalDiscountCents),
      totalAfterDiscount: DiscountCalculator.fromCents(totalAfterCents),
    };
  },
};
