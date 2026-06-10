import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import type { InvitationClient } from "@vulkan/lib/repositories/invitations.repo.types";
import type { EligibilityReasonValue } from "@vulkan/lib/services/eligibility.service.types";

export type InvitationListItem = {
  invitation: Invitation;
  client: InvitationClient;
};

export type InvitationMonitoring = {
  total: number;
  pending: number;
  queued: number;
  processing: number;
  sent: number;
  opened: number;
  failed: number;
  confirmed: number;
};

export type InvitationListView = {
  invitations: InvitationListItem[];
  monitoring: InvitationMonitoring;
};

export type TokenResolutionEvent = {
  id: string;
  name: string;
  status: string;
  eventStartDate: Date;
  eventEndDate: Date | null;
  registrationStartDate: Date;
  registrationEndDate: Date;
  capacity: number;
  availableAttendanceDates: Date[];
  isMultiDay: boolean;
};

export type TokenResolutionConfirmation = {
  confirmed: boolean;
  confirmedAt: Date | null;
};

export type TokenResolutionClient = {
  id: string;
  name: string;
  email: string;
  company: string | null;
};

export type TokenResolutionView = {
  event: TokenResolutionEvent;
  client: TokenResolutionClient;
  confirmation: TokenResolutionConfirmation;
  hasDraft: boolean;
  eligible: boolean;
  reason: EligibilityReasonValue | null;
};

export type GenerateInvitationsResult = {
  created: Invitation[];
  createdCount: number;
  totalRosterClients: number;
  alreadyExistingCount: number;
};

export type OpenTrackingResult = {
  contentType: string;
  body: Buffer;
};
