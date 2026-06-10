import type { PortfolioStatus } from "@/features/portfolios/types/portfolio.types"

export const portfoliosQueryKey = ["portfolios"] as const

export const PortfolioTransitions: Record<PortfolioStatus, PortfolioStatus[]> = {
  draft: ["reviewed"],
  reviewed: ["sent"],
  sent: ["accepted", "rejected"],
  accepted: ["closed"],
  rejected: ["closed"],
  closed: [],
}

export const statusBadgeVariant: Record<PortfolioStatus, string> = {
  draft: "secondary",
  reviewed: "outline",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  closed: "ghost",
}
