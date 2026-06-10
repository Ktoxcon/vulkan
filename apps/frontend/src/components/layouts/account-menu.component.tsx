import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/language-selector.component";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useSignOut } from "@/features/auth/hooks/sign-out.hook";
import { Routes } from "@/lib/constants/routes.constants";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export function AccountMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const signOut = useSignOut();

  const initials =
    [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
    user?.email?.[0] ||
    "?";

  const onSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => navigate(Routes.login, { replace: true }),
    });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t("account.menu")}
        className="flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Avatar size="lg">
          <AvatarFallback className="bg-primary text-primary-foreground uppercase">
            {initials.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-1">
          <LanguageSelector />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onSignOut}
          disabled={signOut.isPending}
          className="gap-2"
        >
          <LogOut className="size-4" />
          {t("account.signOut")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          {t("account.greeting", { name: user?.name })}
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
