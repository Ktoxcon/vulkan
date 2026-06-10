import type { OfferingImportService } from "@vulkan/lib/services/offering-import.service";

export type OfferingImportUpload = {
  fileName: string;
  buffer: Buffer;
};

export type OfferingImportServiceType = typeof OfferingImportService;
