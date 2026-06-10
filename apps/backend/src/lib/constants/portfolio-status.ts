import type { PortfolioStatus as PortfolioStatusType } from "@vulkan/lib/constants/portfolio-status.types";

export const PortfolioStatus = {
  DRAFT: "draft",
  REVIEWED: "reviewed",
  SENT: "sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CLOSED: "closed",
} as const;

export const PortfolioStatusValues = Object.values(PortfolioStatus) as [
  PortfolioStatusType,
  ...PortfolioStatusType[],
];

export const PortfolioTransitions = {
  [PortfolioStatus.DRAFT]: [PortfolioStatus.REVIEWED],
  [PortfolioStatus.REVIEWED]: [PortfolioStatus.SENT],
  [PortfolioStatus.SENT]: [PortfolioStatus.ACCEPTED, PortfolioStatus.REJECTED],
  [PortfolioStatus.ACCEPTED]: [PortfolioStatus.CLOSED],
  [PortfolioStatus.REJECTED]: [PortfolioStatus.CLOSED],
  [PortfolioStatus.CLOSED]: [],
} as const satisfies Record<PortfolioStatusType, readonly PortfolioStatusType[]>;
