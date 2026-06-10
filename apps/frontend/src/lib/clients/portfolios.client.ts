import { downloadFile, request } from "@/lib/clients/http.client"
import type {
  Portfolio,
  PortfolioDetail,
  PortfolioListRow,
  PortfolioStatus,
} from "@/features/portfolios/types/portfolio.types"

async function listByEvent(eventId: string): Promise<PortfolioListRow[]> {
  return request<PortfolioListRow[]>(`/events/${eventId}/portfolios`)
}

async function getById(portfolioId: string): Promise<PortfolioDetail> {
  return request<PortfolioDetail>(`/portfolios/${portfolioId}`)
}

async function updateStatus(
  portfolioId: string,
  status: PortfolioStatus
): Promise<Portfolio> {
  return request<Portfolio>(`/portfolios/${portfolioId}/status`, {
    method: "PATCH",
    body: { status },
  })
}

async function exportCsv(portfolioId: string): Promise<void> {
  return downloadFile(
    `/portfolios/${portfolioId}/export`,
    `portfolio-${portfolioId}.csv`
  )
}

export const PortfoliosClient = { listByEvent, getById, updateStatus, exportCsv }
