import type { Offering } from "@vulkan/lib/db/schema/offerings.types";

export type ClientOfferingView = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
};

export type ClientOfferingsView = {
  products: ClientOfferingView[];
  services: ClientOfferingView[];
};

export type InvitationOfferingsServiceType = {
  listByToken(token: string): Promise<ClientOfferingsView>;
  toClientView(offering: Offering): ClientOfferingView;
};
