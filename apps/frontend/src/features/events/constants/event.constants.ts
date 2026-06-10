import type {
  EventStatus as EventStatusType,
  ReadinessChecks,
} from "@/features/events/types/event.types";

export const eventsQueryKey = ["events"] as const;

export const EVENTS_PAGE_SIZE = 10;

export const EventStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
} as const satisfies Record<string, EventStatusType>;

export const EventTransitions = {
  draft: ["active"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
} as const satisfies Record<EventStatusType, EventStatusType[]>;

export const eventStatusVariant: Record<
  EventStatusType,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  active: "default",
  paused: "secondary",
  closed: "destructive",
};

export const readinessCheckOrder: (keyof ReadinessChecks)[] = [
  "detailsConfigured",
  "capacityConfigured",
  "offeringsAssigned",
  "registrationDatesValid",
  "rosterUploaded",
  "rosterHasValidClient",
  "inviteTokensReady",
  "emailTemplateConfigured",
];
