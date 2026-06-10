import {
  EventStatus,
  EventTransitions,
} from "@vulkan/lib/constants/event-status";
import type { EventStatus as EventStatusType } from "@vulkan/lib/constants/event-status.types";

export function isDraft(status: string): boolean {
  return status === EventStatus.DRAFT;
}

export function canTransition(from: string, to: string): boolean {
  const allowed = EventTransitions[from as EventStatusType];
  return allowed ? allowed.includes(to as EventStatusType) : false;
}
