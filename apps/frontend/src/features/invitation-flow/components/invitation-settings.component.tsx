import { LanguageSelector } from "@/components/language-selector.component";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export function InvitationSettings() {
  const { t } = useTranslation("common");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t("settings.label")}
        className="flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Settings className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-1">
          <LanguageSelector />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
