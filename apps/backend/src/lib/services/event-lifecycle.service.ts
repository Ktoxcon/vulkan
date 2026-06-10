import {
  EventNotFoundError,
  EventNotReadyError,
  IllegalEventTransitionError,
} from "@vulkan/errors/sales-event.errors";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { EventStatus as EventStatusType } from "@vulkan/lib/constants/event-status.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { canTransition } from "@vulkan/lib/events/event-status";
import { CapacityRepository } from "@vulkan/lib/repositories/capacity.repo";
import { InvitationsRepository } from "@vulkan/lib/repositories/invitations.repo";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";
import { EventReadinessService } from "@vulkan/lib/services/event-readiness.service";

export const EventLifecycleService = {
  async transition(
    event: SalesEvent,
    target: EventStatusType,
  ): Promise<SalesEvent> {
    if (event.status === target) {
      throw new IllegalEventTransitionError(event.status, target);
    }
    if (!canTransition(event.status, target)) {
      throw new IllegalEventTransitionError(event.status, target);
    }

    if (event.status === EventStatus.DRAFT && target === EventStatus.ACTIVE) {
      const readiness = await EventReadinessService.evaluate(event);
      if (!readiness.ready) {
        throw new EventNotReadyError(readiness.checks);
      }
    }

    const updated = await SalesEventsRepository.update(event.id, {
      status: target,
    });
    if (!updated) {
      throw new EventNotFoundError();
    }

    if (event.status === EventStatus.DRAFT && target === EventStatus.ACTIVE) {
      await InvitationsRepository.tokensReady(updated.id);
    }

    return updated;
  },

  async shouldAutoClose(
    event: SalesEvent,
    now: Date = new Date(),
  ): Promise<boolean> {
    if (!canTransition(event.status, EventStatus.CLOSED)) {
      return false;
    }

    const { confirmedSeats } = await CapacityRepository.getSeatCounts(
      event.id,
      now,
    );
    if (confirmedSeats >= event.capacity) {
      return true;
    }

    const deadline = event.eventEndDate ?? event.eventStartDate;
    if (deadline instanceof Date && !Number.isNaN(deadline.getTime())) {
      return now.getTime() >= deadline.getTime();
    }

    return false;
  },

  async maybeAutoClose(
    event: SalesEvent,
    now: Date = new Date(),
  ): Promise<SalesEvent> {
    if (await EventLifecycleService.shouldAutoClose(event, now)) {
      const updated = await SalesEventsRepository.update(event.id, {
        status: EventStatus.CLOSED,
      });
      if (!updated) {
        throw new EventNotFoundError();
      }
      return updated;
    }
    return event;
  },
};
