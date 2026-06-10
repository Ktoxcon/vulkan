import { RouteFallback } from "@/components/route-fallback.component";
import { InvitationEventContext } from "@/features/invitation-flow/components/invitation-event-context.component";
import { InvitationSettings } from "@/features/invitation-flow/components/invitation-settings.component";
import { useTokenResolution } from "@/features/invitation-flow/hooks/token-resolution.hook";
import { Suspense } from "react";
import { Outlet, useParams } from "react-router";

export function InvitationLayout() {
  const { token } = useParams<{ token: string }>();
  const { resolution } = useTokenResolution(token);
  const event = resolution?.event ?? null;

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="w-full border-b border-border">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            {event && <InvitationEventContext event={event} />}
          </div>
          <div className="shrink-0">
            <InvitationSettings />
          </div>
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
