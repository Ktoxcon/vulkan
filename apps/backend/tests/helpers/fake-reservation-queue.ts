import type { ReservationExpirationJobData } from "@vulkan/lib/queue/reservation-expiration.queue.types";
import { vi } from "vitest";

export type FakeReservationJob = {
  name: string;
  data: ReservationExpirationJobData;
  opts: { delay?: number };
};

export type FakeReservationQueue = {
  jobs: FakeReservationJob[];
  add: ReturnType<typeof vi.fn>;
  reset: () => void;
};

export function createFakeReservationQueue(): FakeReservationQueue {
  const fake: FakeReservationQueue = {
    jobs: [],
    add: vi.fn(
      async (
        name: string,
        data: ReservationExpirationJobData,
        opts: { delay?: number } = {},
      ) => {
        const job = { name, data, opts };
        fake.jobs.push(job);
        return job;
      },
    ),
    reset: () => {
      fake.jobs = [];
      fake.add.mockClear();
    },
  };
  return fake;
}
