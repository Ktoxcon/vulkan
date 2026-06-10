import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { INTERESTED_OFFERINGS_MAX_HEIGHT } from "@/features/invitation-flow/constants/invitation-flow.constants";
import type { ClientOfferingWithType } from "@/features/invitation-flow/types/invitation-flow.types";
import { cn } from "@/lib/css/classes";
import { formatPrice } from "@/lib/formatters/price.formatter";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

type InterestedOfferingsListProps = {
  offerings: ClientOfferingWithType[];
  selectedIds: string[];
  onToggle: (offering: ClientOfferingWithType) => void;
};

export function InterestedOfferingsList({
  offerings,
  selectedIds,
  onToggle,
}: InterestedOfferingsListProps) {
  const { t } = useTranslation("invitation-flow");
  const searchId = useId();
  const [query, setQuery] = useState("");

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered =
    normalizedQuery.length === 0
      ? offerings
      : offerings.filter((offering) =>
          offering.name.toLowerCase().includes(normalizedQuery),
        );

  const badgeLabel = (type: ClientOfferingWithType["type"]) => {
    if (type === "product") return t("offerings.badge.product");
    if (type === "service") return t("offerings.badge.service");
    return type;
  };

  if (offerings.length === 0) {
    return (
      <p
        data-slot="offerings-empty"
        className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
      >
        {t("interests.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("offerings.title")}
      </h3>

      <div className="flex flex-col gap-1.5">
        <Input
          id={searchId}
          type="search"
          value={query}
          onChange={onSearchChange}
          placeholder={t("offerings.search.placeholder")}
          className="h-11"
        />
      </div>

      {filtered.length === 0 ? (
        <p
          data-slot="offerings-no-results"
          className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
        >
          {t("offerings.noResults")}
        </p>
      ) : (
        <ScrollArea
          className="rounded-md border border-border"
          viewportClassName={cn(
            INTERESTED_OFFERINGS_MAX_HEIGHT,
            "overscroll-contain",
          )}
        >
          <ul className="flex flex-col gap-2 p-2">
            {filtered.map((offering) => {
              const checked = selectedIds.includes(offering.id);
              return (
                <li key={offering.id}>
                  <label
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3",
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      onCheckedChange={() => onToggle(offering)}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0 wrap-break-word text-sm font-medium text-foreground">
                          {offering.name}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-primary">
                          {formatPrice(offering.basePrice)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {badgeLabel(offering.type)}
                        </Badge>
                      </span>
                      {offering.description && (
                        <span className="wrap-break-word text-xs text-muted-foreground">
                          {offering.description}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
