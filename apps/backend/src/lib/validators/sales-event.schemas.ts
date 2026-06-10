import { EventStatusValues } from "@vulkan/lib/constants/event-status";
import { PaginationRequestBody } from "@vulkan/lib/validators/pagination.schemas";
import { z } from "zod";

type DateCandidate = {
  eventStartDate?: Date | undefined;
  eventEndDate?: Date | undefined;
  registrationStartDate?: Date | undefined;
  registrationEndDate?: Date | undefined;
};

function addDateIssues(value: DateCandidate, ctx: z.RefinementCtx): void {
  const {
    registrationStartDate,
    registrationEndDate,
    eventStartDate,
    eventEndDate,
  } = value;

  if (
    registrationStartDate !== undefined &&
    registrationEndDate !== undefined &&
    !(registrationStartDate < registrationEndDate)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "registrationStartDate must be before registrationEndDate",
      path: ["registrationStartDate"],
    });
  }

  if (
    registrationEndDate !== undefined &&
    eventStartDate !== undefined &&
    !(registrationEndDate <= eventStartDate)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "registrationEndDate must be on or before eventStartDate",
      path: ["registrationEndDate"],
    });
  }

  if (
    eventEndDate !== undefined &&
    eventStartDate !== undefined &&
    !(eventEndDate >= eventStartDate)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "eventEndDate must be on or after eventStartDate",
      path: ["eventEndDate"],
    });
  }
}

const CreateBaseSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    description: z.string().optional(),
    capacity: z.coerce
      .number()
      .int("capacity must be an integer")
      .positive("capacity must be greater than 0"),
    reservationTimeoutMinutes: z.coerce
      .number()
      .int("reservationTimeoutMinutes must be an integer")
      .min(0, "reservationTimeoutMinutes cannot be negative")
      .optional(),
    requireConfirmation: z.coerce.boolean().optional(),
    eventStartDate: z.coerce.date(),
    eventEndDate: z.coerce.date().optional(),
    registrationStartDate: z.coerce.date(),
    registrationEndDate: z.coerce.date(),
  })
  .strict();

export const CreateSalesEventRequestBodySchema =
  CreateBaseSchema.superRefine(addDateIssues);

const UpdateBaseSchema = z
  .object({
    name: z.string().min(1, "Event name is required").optional(),
    description: z.string().optional(),
    capacity: z.coerce
      .number()
      .int("capacity must be an integer")
      .positive("capacity must be greater than 0")
      .optional(),
    reservationTimeoutMinutes: z.coerce
      .number()
      .int("reservationTimeoutMinutes must be an integer")
      .min(0, "reservationTimeoutMinutes cannot be negative")
      .optional(),
    requireConfirmation: z.coerce.boolean().optional(),
    eventStartDate: z.coerce.date().optional(),
    eventEndDate: z.coerce.date().optional(),
    registrationStartDate: z.coerce.date().optional(),
    registrationEndDate: z.coerce.date().optional(),
    status: z.enum(EventStatusValues).optional(),
  })
  .strict();

export const UpdateSalesEventRequestBodySchema = UpdateBaseSchema.superRefine(
  (value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field must be provided",
      });
      return;
    }
    addDateIssues(value, ctx);
  },
);

export const EventIdParamSchema = z.string().nonempty();

export const ListSalesEventsQuerySchema = PaginationRequestBody.extend({});
