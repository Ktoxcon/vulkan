import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/i18n.constants";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageSelector() {
  const { t, i18n } = useTranslation("common");

  const current = SUPPORTED_LANGUAGES.includes(
    i18n.language as (typeof SUPPORTED_LANGUAGES)[number],
  )
    ? i18n.language
    : SUPPORTED_LANGUAGES[0];

  const onChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={t("languageSelector.label")}
        className="gap-2"
      >
        <Languages className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">{t("languageSelector.es")}</SelectItem>
        <SelectItem value="en">{t("languageSelector.en")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
