import { Button } from "@/components/ui/button";
import { DiscountSummary } from "@/features/invitation-flow/components/discount-summary.component";
import { InterestedOfferingsList } from "@/features/invitation-flow/components/interested-offerings-list.component";
import { PREVIEW_DEBOUNCE_MS } from "@/features/invitation-flow/constants/invitation-flow.constants";
import type {
  ClientOffering,
  ClientOfferingWithType,
} from "@/features/invitation-flow/types/invitation-flow.types";
import { useDiscountPreview } from "@/features/portfolios/hooks/discount-preview.hook";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

type InterestsStepProps = {
  token: string;
  products: ClientOffering[];
  services: ClientOffering[];
  isLoading: boolean;
  selectedProductIds: string[];
  selectedServiceIds: string[];
  onToggleProduct: (id: string) => void;
  onToggleService: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function InterestsStep({
  token,
  products,
  services,
  isLoading,
  selectedProductIds,
  selectedServiceIds,
  onToggleProduct,
  onToggleService,
  onBack,
  onNext,
}: InterestsStepProps) {
  const { t } = useTranslation("invitation-flow");
  const isEmpty = !isLoading && products.length === 0 && services.length === 0;
  const hasSelection =
    selectedProductIds.length > 0 || selectedServiceIds.length > 0;

  const offerings = useMemo<ClientOfferingWithType[]>(
    () => [
      ...products.map((offering) => ({
        ...offering,
        type: "product" as const,
      })),
      ...services.map((offering) => ({
        ...offering,
        type: "service" as const,
      })),
    ],
    [products, services],
  );

  const selectedIds = useMemo(
    () => [...selectedProductIds, ...selectedServiceIds],
    [selectedProductIds, selectedServiceIds],
  );

  const onToggle = (offering: ClientOfferingWithType) => {
    if (offering.type === "product") {
      onToggleProduct(offering.id);
      return;
    }

    onToggleService(offering.id);
  };

  const {
    mutate: runPreview,
    data: preview,
    isPending: previewPending,
  } = useDiscountPreview(token);

  useEffect(() => {
    const offeringIds = [...selectedProductIds, ...selectedServiceIds];

    if (offeringIds.length === 0) return;

    const timer = setTimeout(
      () => runPreview(offeringIds),
      PREVIEW_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [selectedProductIds, selectedServiceIds, runPreview]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">{t("interests.intro")}</p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t("interests.empty")}
        </p>
      ) : (
        <InterestedOfferingsList
          offerings={offerings}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      )}

      {hasSelection && preview && <DiscountSummary preview={preview} />}
      {hasSelection && !preview && previewPending && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("interests.estimating")}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          onClick={onBack}
        >
          {t("interests.actions.back")}
        </Button>
        <Button type="button" className="h-11 flex-1" onClick={onNext}>
          {t("interests.actions.continue")}
        </Button>
      </div>
    </div>
  );
}
