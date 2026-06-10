import type { EventStatus as EventStatusType } from "@vulkan/lib/constants/event-status.types";

export const EventStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
} as const;

export const EventStatusValues = Object.values(EventStatus) as [
  EventStatusType,
  ...EventStatusType[],
];

export const EventTransitions: Record<EventStatusType, EventStatusType[]> = {
  [EventStatus.DRAFT]: [EventStatus.ACTIVE],
  [EventStatus.ACTIVE]: [EventStatus.PAUSED, EventStatus.CLOSED],
  [EventStatus.PAUSED]: [EventStatus.ACTIVE, EventStatus.CLOSED],
  [EventStatus.CLOSED]: [],
};
