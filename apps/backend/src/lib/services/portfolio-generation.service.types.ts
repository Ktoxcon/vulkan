import type { InvitationClient } from "@vulkan/lib/repositories/invitations.repo.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";

export type PortfolioGenerationArgs = {
  event: SalesEvent;
  client: InvitationClient;
  confirmationId: string;
  ownerId: string;
  offeringIds: string[];
};
