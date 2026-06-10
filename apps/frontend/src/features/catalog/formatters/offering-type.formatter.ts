import i18n from "@/lib/i18n/i18n"
import type { OfferingType } from "@/features/catalog/types/offering.types"

export function formatOfferingType(type: OfferingType): string {
  return i18n.t(`typeOptions.${type}`, { ns: "catalog", defaultValue: type })
}
