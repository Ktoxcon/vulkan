import type { OfferingsService } from "@vulkan/lib/services/offerings.service";

export type OfferingActor = {
  id: string;
  role: string;
};

export type ListOfferingsInput = {
  limit?: number;
  offset?: number;
  type?: string;
  isActive?: boolean;
  search?: string;
};

export type OfferingsServiceType = typeof OfferingsService;
