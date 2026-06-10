import { CapacityRepository } from "@vulkan/lib/repositories/capacity.repo";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type { CapacitySnapshot } from "@vulkan/lib/services/capacity.service.types";

export const CapacityService = {
  async snapshot(
    eventId: string,
    capacity: number,
    now: Date,
    executor?: DbExecutor,
  ): Promise<CapacitySnapshot> {
    const counts = await CapacityRepository.getSeatCounts(
      eventId,
      now,
      executor,
    );
    const availableSeats =
      capacity - counts.confirmedSeats - counts.reservedSeats;

    return {
      capacity,
      confirmedSeats: counts.confirmedSeats,
      reservedSeats: counts.reservedSeats,
      availableSeats,
    };
  },

  hasAvailability(snapshot: CapacitySnapshot): boolean {
    return snapshot.availableSeats > 0;
  },
};
