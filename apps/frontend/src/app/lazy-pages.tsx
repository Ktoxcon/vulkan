import { lazy } from "react";

export const LoginPage = lazy(() =>
  import("@/features/auth/pages/login.page").then(({ LoginPage }) => ({
    default: LoginPage,
  })),
);
export const InvitationPage = lazy(() =>
  import("@/features/invitation-flow/pages/invitation.page").then((m) => ({
    default: m.InvitationPage,
  })),
);
export const AdminLandingPage = lazy(() =>
  import("@/features/dashboard/pages/admin-landing.page").then((m) => ({
    default: m.AdminLandingPage,
  })),
);
export const SalesLandingPage = lazy(() =>
  import("@/features/dashboard/pages/sales-landing.page").then((m) => ({
    default: m.SalesLandingPage,
  })),
);
export const UsersPage = lazy(() =>
  import("@/features/users/pages/users.page").then((m) => ({
    default: m.UsersPage,
  })),
);
export const UserCreatePage = lazy(() =>
  import("@/features/users/pages/user-create.page").then((m) => ({
    default: m.UserCreatePage,
  })),
);
export const UserEditPage = lazy(() =>
  import("@/features/users/pages/user-edit.page").then((m) => ({
    default: m.UserEditPage,
  })),
);
export const EventsPage = lazy(() =>
  import("@/features/events/pages/events.page").then((m) => ({
    default: m.EventsPage,
  })),
);
export const EventCreatePage = lazy(() =>
  import("@/features/events/pages/event-create.page").then((m) => ({
    default: m.EventCreatePage,
  })),
);
export const EventDetailPage = lazy(() =>
  import("@/features/events/pages/event-detail.page").then((m) => ({
    default: m.EventDetailPage,
  })),
);
export const EventEditPage = lazy(() =>
  import("@/features/events/pages/event-edit.page").then((m) => ({
    default: m.EventEditPage,
  })),
);
export const CatalogPage = lazy(() =>
  import("@/features/catalog/pages/catalog.page").then((m) => ({
    default: m.CatalogPage,
  })),
);
export const OfferingCreatePage = lazy(() =>
  import("@/features/catalog/pages/offering-create.page").then((m) => ({
    default: m.OfferingCreatePage,
  })),
);
export const OfferingEditPage = lazy(() =>
  import("@/features/catalog/pages/offering-edit.page").then((m) => ({
    default: m.OfferingEditPage,
  })),
);
export const OfferingImportPage = lazy(() =>
  import("@/features/catalog/pages/offering-import.page").then((m) => ({
    default: m.OfferingImportPage,
  })),
);
export const PortfolioDetailPage = lazy(() =>
  import("@/features/portfolios/pages/portfolio-detail.page").then((m) => ({
    default: m.PortfolioDetailPage,
  })),
);
