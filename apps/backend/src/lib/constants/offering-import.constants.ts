import type { OfferingImportStatus as OfferingImportStatusType } from "@vulkan/lib/constants/offering-import.constants.types";

export const OfferingImportStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
} as const;

export const OfferingImportStatusValues = Object.values(
  OfferingImportStatus,
) as [OfferingImportStatusType, ...OfferingImportStatusType[]];

export const OfferingImportCsvMaxRows = 10000;

export const OfferingImportCsvAcceptedMimeTypes = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
] as const;
