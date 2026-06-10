import type {
  AddRosterClientBodySchema,
  ConfirmImportBodySchema,
  RosterCsvRowSchema,
} from "@vulkan/lib/validators/roster.schemas";
import type { z } from "zod";

export type ConfirmImportBody = z.infer<typeof ConfirmImportBodySchema>;

export type RosterCsvRow = z.infer<typeof RosterCsvRowSchema>;

export type AddRosterClientBody = z.infer<typeof AddRosterClientBodySchema>;
