import type { RostersRepository } from "@vulkan/lib/repositories/rosters.repo";

export type RostersRepositoryType = typeof RostersRepository;

export type RosterMember = {
  rosterClientId: string;
  clientId: string;
  email: string;
  name: string;
  company: string | null;
  createdAt: Date;
};
