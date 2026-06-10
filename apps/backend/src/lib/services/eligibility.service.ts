import {
  AlreadyConfirmedError,
  CapacityReachedError,
  EventPausedError,
  InvalidTokenError,
  RegistrationClosedError,
  RegistrationNotStartedError,
} from "@vulkan/errors/eligibility.errors";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type { TokenResolution } from "@vulkan/lib/repositories/invitations.repo.types";
import { CapacityService } from "@vulkan/lib/services/capacity.service";
import {
  EligibilityReason,
  EligibilityReasonMessage,
} from "@vulkan/lib/services/eligibility.service.constants";
import type {
  EligibilityReasonValue,
  EligibilityResult,
} from "@vulkan/lib/services/eligibility.service.types";

export const EligibilityService = {
  async evaluate(
    resolution: TokenResolution | undefined,
    now: Date,
    executor?: DbExecutor,
  ): Promise<EligibilityResult> {
    if (!resolution) {
      return EligibilityService.deny(EligibilityReason.INVALID_TOKEN);
    }

    const { event, invitation } = resolution;

    if (invitation.confirmedAt !== null) {
      return EligibilityService.deny(EligibilityReason.ALREADY_CONFIRMED);
    }

    if (event.status === EventStatus.PAUSED) {
      return EligibilityService.deny(EligibilityReason.EVENT_PAUSED);
    }

    if (now < event.registrationStartDate) {
      return EligibilityService.deny(
        EligibilityReason.REGISTRATION_NOT_STARTED,
      );
    }

    if (now > event.registrationEndDate || event.status !== EventStatus.ACTIVE) {
      return EligibilityService.deny(EligibilityReason.REGISTRATION_CLOSED);
    }

    const snapshot = await CapacityService.snapshot(
      event.id,
      event.capacity,
      now,
      executor,
    );
    if (!CapacityService.hasAvailability(snapshot)) {
      return EligibilityService.deny(EligibilityReason.CAPACITY_REACHED);
    }

    return { eligible: true, reason: null, message: null };
  },

  async assertEligible(
    resolution: TokenResolution | undefined,
    now: Date,
    executor?: DbExecutor,
  ): Promise<TokenResolution> {
    const result = await EligibilityService.evaluate(resolution, now, executor);
    if (result.eligible) {
      return resolution as TokenResolution;
    }
    throw EligibilityService.toError(result.reason);
  },

  deny(reason: EligibilityReasonValue): EligibilityResult {
    return {
      eligible: false,
      reason,
      message: EligibilityReasonMessage[reason],
    };
  },

  toError(reason: EligibilityReasonValue) {
    switch (reason) {
      case EligibilityReason.INVALID_TOKEN:
        return new InvalidTokenError();
      case EligibilityReason.REGISTRATION_NOT_STARTED:
        return new RegistrationNotStartedError();
      case EligibilityReason.REGISTRATION_CLOSED:
        return new RegistrationClosedError();
      case EligibilityReason.EVENT_PAUSED:
        return new EventPausedError();
      case EligibilityReason.CAPACITY_REACHED:
        return new CapacityReachedError();
      case EligibilityReason.ALREADY_CONFIRMED:
        return new AlreadyConfirmedError();
    }
  },
};
