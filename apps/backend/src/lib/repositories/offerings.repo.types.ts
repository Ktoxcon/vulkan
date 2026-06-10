import type { Offering } from "@vulkan/lib/db/schema/offerings.types";
import type { OfferingsRepository } from "@vulkan/lib/repositories/offerings.repo";

export type FindByNameAndTypeParams = {
  name: string;
  type: string;
};

export type ListOfferingsParams = {
  limit?: number;
  offset?: number;
  type?: string;
  isActive?: boolean;
  search?: string;
};

export type ListOfferingsResult = {
  count: number;
  items: Offering[];
};

export type OfferingWithPrice = {
  offeringId: string;
  name: string;
  type: string;
  basePrice: string;
};

export type OfferingsRepositoryType = typeof OfferingsRepository;
