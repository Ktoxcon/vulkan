import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PortfolioCategoryBreakdown } from "@/features/portfolios/components/portfolio-category-breakdown.component"
import { SummaryRow } from "@/features/portfolios/components/summary-row.component"
import type { PortfolioDetail } from "@/features/portfolios/types/portfolio.types"
import { formatPrice } from "@/lib/formatters/price.formatter"

type PortfolioTotalsProps = {
  portfolio: PortfolioDetail
}

export function PortfolioTotals({ portfolio }: PortfolioTotalsProps) {
  const { t } = useTranslation("portfolios")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("totals.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <PortfolioCategoryBreakdown
            title={t("totals.services")}
            subtotal={portfolio.serviceSubtotal}
            discountPercentage={portfolio.serviceDiscountPercentage}
            discountAmount={portfolio.serviceDiscountAmount}
            totalAfterDiscount={portfolio.serviceTotalAfterDiscount}
          />
          <PortfolioCategoryBreakdown
            title={t("totals.products")}
            subtotal={portfolio.productSubtotal}
            discountPercentage={portfolio.productDiscountPercentage}
            discountAmount={portfolio.productDiscountAmount}
            totalAfterDiscount={portfolio.productTotalAfterDiscount}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <SummaryRow
            label={t("totals.totalBeforeDiscount")}
            value={formatPrice(portfolio.totalBeforeDiscount)}
          />
          <SummaryRow
            label={t("totals.totalDiscount")}
            value={formatPrice(portfolio.totalDiscountAmount)}
          />
          <div className="flex items-center justify-between gap-4 text-base font-semibold">
            <span>{t("totals.totalAfterDiscount")}</span>
            <span className="tabular-nums text-primary">
              {formatPrice(portfolio.totalAfterDiscount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
