import type { OfferingType } from "@vulkan/lib/validators/offering.schemas";

export type OfferingTypeValue = (typeof OfferingType)[keyof typeof OfferingType];

export type DiscountSelection = {
  offeringId: string;
  name: string;
  type: OfferingTypeValue;
  basePrice: string | number;
};

export type DiscountItem = {
  offeringId: string;
  offeringName: string;
  offeringType: OfferingTypeValue;
  basePrice: string;
  discountPercentage: number;
  discountAmount: string;
  finalPrice: string;
};

export type DiscountCalculationResult = {
  serviceCount: number;
  serviceSubtotal: string;
  serviceDiscountPercentage: number;
  serviceDiscountAmount: string;
  serviceTotalAfterDiscount: string;
  productCount: number;
  productSubtotal: string;
  productDiscountPercentage: number;
  productDiscountAmount: string;
  productTotalAfterDiscount: string;
  totalBeforeDiscount: string;
  totalDiscountAmount: string;
  totalAfterDiscount: string;
};
