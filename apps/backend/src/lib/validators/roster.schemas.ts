import { ImportRecordStatus } from "@vulkan/lib/services/roster.service.constants";
import { z } from "zod";

export const ImportIdParamSchema = z.uuid();

export const ConfirmImportBodySchema = z.object({
  status: z.literal(ImportRecordStatus.CONFIRMED),
});

export const RosterCsvRowSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  email: z.string().trim().toLowerCase().pipe(z.email("email is invalid")),
  company: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .default(null),
});

export const AddRosterClientBodySchema = RosterCsvRowSchema;
