import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";

export type DispatchInvitationClient = {
  id: string;
  email: string;
  name: string;
  company: string | null;
};

export type DispatchInvitationContext = {
  invitation: Invitation;
  client: DispatchInvitationClient;
  event: SalesEvent;
};
