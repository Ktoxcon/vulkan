import type { Database } from "@vulkan/lib/db/index";

export type DbExecutor =
  | Database
  | Parameters<Parameters<Database["transaction"]>[0]>[0];

export type SeatCounts = {
  confirmedSeats: number;
  reservedSeats: number;
};
