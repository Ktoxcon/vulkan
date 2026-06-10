import type { OfferingImportStatus as OfferingImportStatusConst } from "@vulkan/lib/constants/offering-import.constants";

export type OfferingImportStatus =
  (typeof OfferingImportStatusConst)[keyof typeof OfferingImportStatusConst];
