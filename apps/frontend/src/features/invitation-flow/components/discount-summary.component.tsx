import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DiscountCategorySummary } from "@/features/portfolios/components/discount-category-summary.component";
import { SummaryRow } from "@/features/portfolios/components/summary-row.component";
import type { DiscountPreview } from "@/features/portfolios/types/portfolio.types";
import { cn } from "@/lib/css/classes";
import { formatPrice } from "@/lib/formatters/price.formatter";

type DiscountSummaryProps = {
  preview: DiscountPreview;
};

export function DiscountSummary({ preview }: DiscountSummaryProps) {
  const { t } = useTranslation("portfolios");

  const hasPercentages =
    preview.services.discountPercentage > 0 ||
    preview.products.discountPercentage > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">
            {t("discountSummary.title")}
          </CardTitle>
          <span className="text-2xl font-semibold tabular-nums text-primary">
            {formatPrice(preview.totalAfterDiscount)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Collapsible className="flex flex-col gap-3">
          <CollapsibleTrigger
            aria-label={t("discountSummary.details")}
            className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span>{t("discountSummary.details")}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="hidden group-data-[state=open]:inline">
                {t("discountSummary.collapse")}
              </span>
              <span className="inline group-data-[state=open]:hidden">
                {t("discountSummary.expand")}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-data-[state=open]:rotate-180"
              />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-4">
              <div className="grid gap-6 md:grid-cols-2">
                <DiscountCategorySummary
                  title={t("discountSummary.services")}
                  category={preview.services}
                />
                <DiscountCategorySummary
                  title={t("discountSummary.products")}
                  category={preview.products}
                />
              </div>
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <SummaryRow
                  label={t("discountSummary.totalBeforeDiscount")}
                  value={formatPrice(preview.totalBeforeDiscount)}
                />
                <SummaryRow
                  label={t("discountSummary.totalDiscount")}
                  value={formatPrice(preview.totalDiscountAmount)}
                />
                <div className="flex items-center justify-between gap-4 text-base font-semibold">
                  <span>{t("discountSummary.totalAfterDiscount")}</span>
                  <span className="tabular-nums text-primary">
                    {formatPrice(preview.totalAfterDiscount)}
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {hasPercentages && (
          <div
            className={cn(
              "flex flex-col gap-2 border-t border-border pt-3",
            )}
          >
            <h3 className="text-sm font-semibold tracking-tight">
              {t("discountSummary.percentages")}
            </h3>
            <SummaryRow
              label={t("discountSummary.services")}
              value={`${preview.services.discountPercentage}%`}
            />
            <SummaryRow
              label={t("discountSummary.products")}
              value={`${preview.products.discountPercentage}%`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
