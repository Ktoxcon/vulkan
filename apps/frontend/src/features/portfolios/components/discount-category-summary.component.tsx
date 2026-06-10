import { useTranslation } from "react-i18next"
import { SummaryRow } from "@/features/portfolios/components/summary-row.component"
import type { DiscountPreviewCategory } from "@/features/portfolios/types/portfolio.types"
import { formatPrice } from "@/lib/formatters/price.formatter"

type DiscountCategorySummaryProps = {
  title: string
  category: DiscountPreviewCategory
}

export function DiscountCategorySummary({
  title,
  category,
}: DiscountCategorySummaryProps) {
  const { t } = useTranslation("portfolios")

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <SummaryRow label={t("discountSummary.items")} value={String(category.count)} />
      <SummaryRow label={t("discountSummary.subtotal")} value={formatPrice(category.subtotal)} />
      <SummaryRow label={t("discountSummary.discount")} value={`${category.discountPercentage}%`} />
      <SummaryRow
        label={t("discountSummary.discountAmount")}
        value={formatPrice(category.discountAmount)}
      />
      <SummaryRow
        label={t("discountSummary.afterDiscount")}
        value={formatPrice(category.totalAfterDiscount)}
      />
    </div>
  )
}
