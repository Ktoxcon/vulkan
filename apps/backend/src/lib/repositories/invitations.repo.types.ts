import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";

export type NewInvitationWithToken = {
  rosterClientId: string;
  token: string;
};

export type InvitationStatusCount = {
  status: string;
  total: number;
};

export type InvitationStats = {
  invited: number;
  opened: number;
  started: number;
  confirmed: number;
};

export type InvitationClient = {
  id: string;
  email: string;
  name: string;
  company: string | null;
};

export type InvitationListRow = {
  invitation: Invitation;
  client: InvitationClient;
};

export type TokenResolution = {
  invitation: Invitation;
  client: InvitationClient;
  event: SalesEvent;
};
