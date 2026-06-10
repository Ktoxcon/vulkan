import type { InvitationEmailJobData } from "@vulkan/lib/queue/invitation-email.queue.types";
import { vi } from "vitest";

export type FakeJob = {
  name: string;
  data: InvitationEmailJobData;
};

export type FakeQueue = {
  jobs: FakeJob[];
  addBulk: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  reset: () => void;
};

export function createFakeQueue(): FakeQueue {
  const fake: FakeQueue = {
    jobs: [],
    addBulk: vi.fn(async (entries: FakeJob[]) => {
      fake.jobs.push(...entries);
      return entries;
    }),
    add: vi.fn(async (name: string, data: InvitationEmailJobData) => {
      const job = { name, data };
      fake.jobs.push(job);
      return job;
    }),
    reset: () => {
      fake.jobs = [];
      fake.addBulk.mockClear();
      fake.add.mockClear();
    },
  };
  return fake;
}
