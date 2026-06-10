import { OfferingType } from "@vulkan/lib/validators/offering.schemas";
import { DiscountCalculator } from "@vulkan/lib/services/discount-calculator.service";
import type { DiscountSelection } from "@vulkan/lib/services/discount-calculator.service.types";
import { describe, expect, it } from "vitest";

let counter = 0;

function service(basePrice: string | number): DiscountSelection {
  counter += 1;
  return {
    offeringId: `service-${counter}`,
    name: `Service ${counter}`,
    type: OfferingType.SERVICE,
    basePrice,
  };
}

function product(basePrice: string | number): DiscountSelection {
  counter += 1;
  return {
    offeringId: `product-${counter}`,
    name: `Product ${counter}`,
    type: OfferingType.PRODUCT,
    basePrice,
  };
}

function sumCents(values: string[]): number {
  return values.reduce(
    (total, value) => total + DiscountCalculator.toCents(value),
    0,
  );
}

describe("DiscountCalculator", () => {
  describe("Money members", () => {
    it("toCents parses a numeric string into integer minor units", () => {
      expect(DiscountCalculator.toCents("1500.00")).toBe(150000);
      expect(DiscountCalculator.toCents("800")).toBe(80000);
      expect(DiscountCalculator.toCents(900)).toBe(90000);
    });

    it("fromCents renders cents as a 2-decimal currency string", () => {
      expect(DiscountCalculator.fromCents(150000)).toBe("1500.00");
      expect(DiscountCalculator.fromCents(76000)).toBe("760.00");
      expect(DiscountCalculator.fromCents(0)).toBe("0.00");
    });

    it("applyPercent rounds to the nearest cent", () => {
      expect(DiscountCalculator.applyPercent(80000, 5)).toBe(4000);
      expect(DiscountCalculator.applyPercent(90000, 5)).toBe(4500);
      expect(DiscountCalculator.applyPercent(10033, 3)).toBe(301);
    });
  });

  describe("service discount rules", () => {
    it("2 services @ 800/900 (subtotal 1700 > 1500) -> 5%, items 760/855", () => {
      const selections = [service("800.00"), service("900.00")];
      const result = DiscountCalculator.calculate(selections);
      const items = DiscountCalculator.buildItems(selections);

      expect(result.serviceCount).toBe(2);
      expect(result.serviceSubtotal).toBe("1700.00");
      expect(result.serviceDiscountPercentage).toBe(5);
      expect(result.serviceDiscountAmount).toBe("85.00");
      expect(result.serviceTotalAfterDiscount).toBe("1615.00");

      expect(items[0].finalPrice).toBe("760.00");
      expect(items[1].finalPrice).toBe("855.00");
      expect(items[0].discountAmount).toBe("40.00");
      expect(items[1].discountAmount).toBe("45.00");
    });

    it("boundary subtotal == 1500 -> 3% (strictly greater-than)", () => {
      const selections = [service("750.00"), service("750.00")];
      const result = DiscountCalculator.calculate(selections);
      expect(result.serviceSubtotal).toBe("1500.00");
      expect(result.serviceDiscountPercentage).toBe(3);
      expect(result.serviceDiscountAmount).toBe("45.00");
    });

    it("just above 1500 -> 5%", () => {
      const selections = [service("750.00"), service("750.01")];
      const result = DiscountCalculator.calculate(selections);
      expect(result.serviceDiscountPercentage).toBe(5);
    });

    it("2 services with low subtotal -> 3%", () => {
      const selections = [service("100.00"), service("200.00")];
      const result = DiscountCalculator.calculate(selections);
      expect(result.serviceDiscountPercentage).toBe(3);
    });

    it("1 service -> 0%", () => {
      const result = DiscountCalculator.calculate([service("5000.00")]);
      expect(result.serviceCount).toBe(1);
      expect(result.serviceDiscountPercentage).toBe(0);
      expect(result.serviceDiscountAmount).toBe("0.00");
      expect(result.serviceTotalAfterDiscount).toBe("5000.00");
    });
  });

  describe("product discount rules", () => {
    it("3 products -> 3%", () => {
      const selections = [product("100.00"), product("100.00"), product("100.00")];
      const result = DiscountCalculator.calculate(selections);
      expect(result.productCount).toBe(3);
      expect(result.productDiscountPercentage).toBe(3);
      expect(result.productDiscountAmount).toBe("9.00");
      expect(result.productTotalAfterDiscount).toBe("291.00");
    });

    it("5 products -> 5%", () => {
      const selections = [
        product("100.00"),
        product("100.00"),
        product("100.00"),
        product("100.00"),
        product("100.00"),
      ];
      const result = DiscountCalculator.calculate(selections);
      expect(result.productCount).toBe(5);
      expect(result.productDiscountPercentage).toBe(5);
      expect(result.productDiscountAmount).toBe("25.00");
    });

    it("2 products -> 0%", () => {
      const result = DiscountCalculator.calculate([
        product("100.00"),
        product("100.00"),
      ]);
      expect(result.productDiscountPercentage).toBe(0);
      expect(result.productDiscountAmount).toBe("0.00");
    });

    it("4 products -> 3% (boundary below the high tier)", () => {
      const selections = [
        product("100.00"),
        product("100.00"),
        product("100.00"),
        product("100.00"),
      ];
      const result = DiscountCalculator.calculate(selections);
      expect(result.productDiscountPercentage).toBe(3);
    });
  });

  describe("empty / single selection", () => {
    it("empty selection -> all zeros", () => {
      const result = DiscountCalculator.calculate([]);
      expect(result.serviceCount).toBe(0);
      expect(result.productCount).toBe(0);
      expect(result.totalBeforeDiscount).toBe("0.00");
      expect(result.totalDiscountAmount).toBe("0.00");
      expect(result.totalAfterDiscount).toBe("0.00");
      expect(DiscountCalculator.buildItems([])).toEqual([]);
    });
  });

  describe("per-item rounding reconciles to totals exactly", () => {
    it("category and grand totals equal the sum of per-item values", () => {
      const selections = [
        service("333.33"),
        service("466.67"),
        service("700.01"),
        product("19.99"),
        product("19.99"),
        product("19.99"),
        product("19.99"),
        product("19.99"),
      ];
      const items = DiscountCalculator.buildItems(selections);
      const result = DiscountCalculator.calculate(selections);

      const serviceItems = items.filter(
        (item) => item.offeringType === OfferingType.SERVICE,
      );
      const productItems = items.filter(
        (item) => item.offeringType === OfferingType.PRODUCT,
      );

      expect(DiscountCalculator.toCents(result.serviceDiscountAmount)).toBe(
        sumCents(serviceItems.map((item) => item.discountAmount)),
      );
      expect(DiscountCalculator.toCents(result.productDiscountAmount)).toBe(
        sumCents(productItems.map((item) => item.discountAmount)),
      );
      expect(DiscountCalculator.toCents(result.serviceTotalAfterDiscount)).toBe(
        sumCents(serviceItems.map((item) => item.finalPrice)),
      );
      expect(DiscountCalculator.toCents(result.productTotalAfterDiscount)).toBe(
        sumCents(productItems.map((item) => item.finalPrice)),
      );

      expect(DiscountCalculator.toCents(result.totalDiscountAmount)).toBe(
        sumCents(items.map((item) => item.discountAmount)),
      );
      expect(DiscountCalculator.toCents(result.totalAfterDiscount)).toBe(
        sumCents(items.map((item) => item.finalPrice)),
      );
      expect(DiscountCalculator.toCents(result.totalBeforeDiscount)).toBe(
        sumCents(items.map((item) => item.basePrice)),
      );

      items.forEach((item) => {
        expect(DiscountCalculator.toCents(item.finalPrice)).toBe(
          DiscountCalculator.toCents(item.basePrice) -
            DiscountCalculator.toCents(item.discountAmount),
        );
      });
    });
  });

  describe("mixed product + service basket", () => {
    it("computes each category independently and sums the grand totals", () => {
      const selections = [
        service("800.00"),
        service("900.00"),
        product("100.00"),
        product("100.00"),
        product("100.00"),
      ];
      const result = DiscountCalculator.calculate(selections);

      expect(result.serviceCount).toBe(2);
      expect(result.serviceDiscountPercentage).toBe(5);
      expect(result.serviceDiscountAmount).toBe("85.00");

      expect(result.productCount).toBe(3);
      expect(result.productDiscountPercentage).toBe(3);
      expect(result.productDiscountAmount).toBe("9.00");

      expect(result.totalBeforeDiscount).toBe("2000.00");
      expect(result.totalDiscountAmount).toBe("94.00");
      expect(result.totalAfterDiscount).toBe("1906.00");
    });
  });
});
