import type { EligibilityReason } from "@vulkan/lib/services/eligibility.service.constants";

export type EligibilityReasonValue =
  (typeof EligibilityReason)[keyof typeof EligibilityReason];

export type EligibilityResult =
  | { eligible: true; reason: null; message: null }
  | {
      eligible: false;
      reason: EligibilityReasonValue;
      message: string;
    };
