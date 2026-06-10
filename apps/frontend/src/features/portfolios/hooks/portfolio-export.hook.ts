import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { PortfoliosClient } from "@/lib/clients/portfolios.client"
import { ApiError } from "@/lib/errors/api.error"

export function useExportPortfolio(portfolioId: string) {
  const { t } = useTranslation("portfolios")

  return useMutation<void, Error, void>({
    mutationFn: () => PortfoliosClient.exportCsv(portfolioId),
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t("toast.exportFailed")
      )
    },
  })
}
