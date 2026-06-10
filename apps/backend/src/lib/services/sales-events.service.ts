import {
  CapacityBelowConfirmedError,
  EventFieldsLockedError,
  EventForbiddenError,
  EventNotFoundError,
} from "@vulkan/errors/sales-event.errors";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import { UserRoles } from "@vulkan/lib/constants/roles";
import type {
  NewSalesEvent,
  SalesEvent,
} from "@vulkan/lib/db/schema/sales-events.types";
import { isDraft } from "@vulkan/lib/events/event-status";
import { CapacityRepository } from "@vulkan/lib/repositories/capacity.repo";
import { SalesEventsRepository } from "@vulkan/lib/repositories/sales-events.repo";
import type { ListSalesEventsResult } from "@vulkan/lib/repositories/sales-events.repo.types";
import { EventLifecycleService } from "@vulkan/lib/services/event-lifecycle.service";
import { STRUCTURAL_FIELDS } from "@vulkan/lib/services/sales-events.service.constants";
import type { Actor } from "@vulkan/lib/services/sales-events.service.types";
import type {
  CreateSalesEventRequestBody,
  UpdateSalesEventRequestBody,
} from "@vulkan/lib/validators/sales-event.types";

export const SalesEventsService = {
  assertCanAccess(actor: Actor, event: SalesEvent): void {
    if (actor.role === UserRoles.ADMIN) return;
    if (event.ownerId === actor.id) return;
    throw new EventForbiddenError();
  },

  async create(
    actor: Actor,
    input: CreateSalesEventRequestBody,
  ): Promise<SalesEvent> {
    return SalesEventsRepository.create({
      ownerId: actor.id,
      name: input.name,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      capacity: input.capacity,
      eventStartDate: input.eventStartDate,
      ...(input.eventEndDate !== undefined
        ? { eventEndDate: input.eventEndDate }
        : {}),
      registrationStartDate: input.registrationStartDate,
      registrationEndDate: input.registrationEndDate,
      ...(input.reservationTimeoutMinutes !== undefined
        ? { reservationTimeoutMinutes: input.reservationTimeoutMinutes }
        : {}),
      ...(input.requireConfirmation !== undefined
        ? { requireConfirmation: input.requireConfirmation }
        : {}),
      status: EventStatus.DRAFT,
    });
  },

  async getById(actor: Actor, id: string): Promise<SalesEvent> {
    const event = await SalesEventsRepository.findById(id);
    if (!event) {
      throw new EventNotFoundError();
    }
    SalesEventsService.assertCanAccess(actor, event);
    return event;
  },

  async list(
    actor: Actor,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListSalesEventsResult> {
    return SalesEventsRepository.list({
      ...(actor.role === UserRoles.ADMIN ? {} : { ownerId: actor.id }),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(params.offset !== undefined ? { offset: params.offset } : {}),
    });
  },

  async update(
    actor: Actor,
    event: SalesEvent,
    patch: UpdateSalesEventRequestBody,
  ): Promise<SalesEvent> {
    SalesEventsService.assertCanAccess(actor, event);

    const { status, ...fields } = patch;

    const hasFieldEdits = Object.values(fields).some(
      (value) => value !== undefined,
    );

    let current = event;

    if (hasFieldEdits) {
      if (!isDraft(current.status)) {
        const touchesStructural = STRUCTURAL_FIELDS.some(
          (field) => fields[field] !== undefined,
        );
        if (touchesStructural) {
          throw new EventFieldsLockedError();
        }
      }

      if (fields.capacity !== undefined) {
        const { confirmedSeats } = await CapacityRepository.getSeatCounts(
          current.id,
          new Date(),
        );
        if (fields.capacity < confirmedSeats) {
          throw new CapacityBelowConfirmedError(confirmedSeats);
        }
      }

      const cleanPatch: Partial<NewSalesEvent> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          (cleanPatch as Record<string, unknown>)[key] = value;
        }
      }

      const updated = await SalesEventsRepository.update(current.id, cleanPatch);
      if (!updated) {
        throw new EventNotFoundError();
      }
      current = updated;
    }

    if (status !== undefined) {
      current = await EventLifecycleService.transition(current, status);
    }

    return current;
  },
};
