import { ForbiddenPage } from "@/app/forbidden.page";
import { AppLayout } from "@/components/layouts/app.layout";
import { AuthLayout } from "@/components/layouts/auth.layout";
import { InvitationLayout } from "@/components/layouts/invitation.layout";
import { ProtectedRoute } from "@/features/auth/components/protected-route.component";
import { RoleLanding } from "@/features/auth/components/role-landing.component";
import { Routes } from "@/lib/constants/routes.constants";
import {
  AdminLandingPage,
  CatalogPage,
  EventCreatePage,
  EventDetailPage,
  EventEditPage,
  EventsPage,
  InvitationPage,
  LoginPage,
  OfferingCreatePage,
  OfferingEditPage,
  OfferingImportPage,
  PortfolioDetailPage,
  SalesLandingPage,
  UserCreatePage,
  UserEditPage,
  UsersPage,
} from "@/app/lazy-pages";
import { createBrowserRouter, Navigate } from "react-router";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: Routes.login,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: Routes.forbidden,
    element: <ForbiddenPage />,
  },
  {
    element: <InvitationLayout />,
    children: [
      {
        path: Routes.invitation,
        element: <InvitationPage />,
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RoleLanding />,
      },
      {
        path: Routes.admin,
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminLandingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.sales,
        element: (
          <ProtectedRoute requiredRole="sales">
            <SalesLandingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.users,
        element: (
          <ProtectedRoute requiredRole="admin">
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.usersNew,
        element: (
          <ProtectedRoute requiredRole="admin">
            <UserCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.userEdit,
        element: (
          <ProtectedRoute requiredRole="admin">
            <UserEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.events,
        element: <EventsPage />,
      },
      {
        path: Routes.eventsNew,
        element: <EventCreatePage />,
      },
      {
        path: Routes.eventDetail,
        element: <EventDetailPage />,
      },
      {
        path: Routes.eventEdit,
        element: <EventEditPage />,
      },
      {
        path: Routes.portfolioDetail,
        element: <PortfolioDetailPage />,
      },
      {
        path: Routes.catalog,
        element: (
          <ProtectedRoute requiredRole="admin">
            <CatalogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.catalogNew,
        element: (
          <ProtectedRoute requiredRole="admin">
            <OfferingCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.catalogImport,
        element: (
          <ProtectedRoute requiredRole="admin">
            <OfferingImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: Routes.catalogEdit,
        element: (
          <ProtectedRoute requiredRole="admin">
            <OfferingEditPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={Routes.home} replace />,
  },
]);
