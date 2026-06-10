import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { navItems } from "@/lib/constants/nav-items.constants";
import { Routes } from "@/lib/constants/routes.constants";
import { cn } from "@/lib/css/classes";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router";

export function MobileNav() {
  const { role } = useAuth();
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  const items = navItems.filter(
    (item) => item.requiredRole === undefined || role === item.requiredRole,
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("nav.openNavigation")}
        className="size-11 md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle asChild>
            <Link
              to={Routes.home}
              onClick={() => setOpen(false)}
              className="text-lg font-semibold tracking-tight text-primary"
            >
              {t("brand")}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-muted text-foreground",
                  )
                }
              >
                <Icon className="size-4" />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
