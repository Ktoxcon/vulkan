import { AccountMenu } from "@/components/layouts/account-menu.component";
import { MobileNav } from "@/components/layouts/mobile-nav.component";
import { RouteFallback } from "@/components/route-fallback.component";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { navItems } from "@/lib/constants/nav-items.constants";
import { Routes } from "@/lib/constants/routes.constants";
import { cn } from "@/lib/css/classes";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet } from "react-router";

export function AppLayout() {
  const { role } = useAuth();
  const { t } = useTranslation("common");

  const items = navItems.filter(
    (item) => item.requiredRole === undefined || role === item.requiredRole,
  );

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <MobileNav />
            <Link
              to={Routes.home}
              className="text-lg font-semibold tracking-tight text-primary"
            >
              {t("brand")}
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                        isActive && "text-foreground",
                      )
                    }
                  >
                    <Icon className="size-4" />
                    {t(item.label)}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <AccountMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          {t("tagline", { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}
