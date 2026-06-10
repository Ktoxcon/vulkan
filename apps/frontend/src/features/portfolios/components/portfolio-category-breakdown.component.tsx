import { useTranslation } from "react-i18next"
import { SummaryRow } from "@/features/portfolios/components/summary-row.component"
import { formatPrice } from "@/lib/formatters/price.formatter"

type PortfolioCategoryBreakdownProps = {
  title: string
  subtotal: string
  discountPercentage: number
  discountAmount: string
  totalAfterDiscount: string
}

export function PortfolioCategoryBreakdown({
  title,
  subtotal,
  discountPercentage,
  discountAmount,
  totalAfterDiscount,
}: PortfolioCategoryBreakdownProps) {
  const { t } = useTranslation("portfolios")

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <SummaryRow label={t("categoryBreakdown.subtotal")} value={formatPrice(subtotal)} />
      <SummaryRow label={t("categoryBreakdown.discount")} value={`${discountPercentage}%`} />
      <SummaryRow
        label={t("categoryBreakdown.discountAmount")}
        value={formatPrice(discountAmount)}
      />
      <SummaryRow
        label={t("categoryBreakdown.afterDiscount")}
        value={formatPrice(totalAfterDiscount)}
      />
    </div>
  )
}
