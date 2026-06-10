import { useState } from "react"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQueryClient } from "@tanstack/react-query"
import { EventStatusBadge } from "@/features/events/components/event-status-badge.component"
import { EventHeaderActions } from "@/features/events/components/event-header-actions.component"
import { ReadinessChecklist } from "@/features/events/components/readiness-checklist.component"
import { EventOfferingsPanel } from "@/features/events/components/event-offerings-panel.component"
import { RosterTab } from "@/features/roster/components/roster-tab.component"
import { EmailTemplateTab } from "@/features/email-templates/components/email-template-tab.component"
import { InvitationsTab } from "@/features/invitations/components/invitations-tab.component"
import { EventPortfoliosPanel } from "@/features/events/components/event-portfolios-panel.component"
import { useEvent } from "@/features/events/hooks/event.hook"
import { eventsQueryKey } from "@/features/events/constants/event.constants"
import { Routes } from "@/lib/constants/routes.constants"
import { formatDate } from "@/lib/formatters/date.formatter"

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { t } = useTranslation("events")
  const queryClient = useQueryClient()
  const [tab, setTab] = useState("overview")
  const { event, isLoading, isError } = useEvent(eventId)

  const onNotReady = () => {
    if (!eventId) return
    queryClient.invalidateQueries({
      queryKey: [...eventsQueryKey, "detail", eventId, "readiness"],
    })
    setTab("overview")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" aria-label={t("loading")} />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm font-medium text-destructive">{t("detail.notFound")}</p>
        <Button asChild variant="outline" className="h-11 md:h-9">
          <Link to={Routes.events}>{t("detail.back")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-11 w-fit px-2 md:h-9"
        >
          <Link to={Routes.events}>
            <ArrowLeft />
            {t("detail.back")}
          </Link>
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              {event.name}
            </h1>
            <EventStatusBadge status={event.status} />
          </div>
          <EventHeaderActions
            event={event}
            editHref={`/events/${event.id}/edit`}
            onNotReady={onNotReady}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="w-full justify-start overflow-x-auto py-1 group-data-[orientation=horizontal]/tabs:h-auto">
          <TabsTrigger value="overview">{t("detail.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="offerings">{t("detail.tabs.offerings")}</TabsTrigger>
          <TabsTrigger value="roster">{t("detail.tabs.roster")}</TabsTrigger>
          <TabsTrigger value="email-template">{t("detail.tabs.emailTemplate")}</TabsTrigger>
          <TabsTrigger value="invitations">{t("detail.tabs.invitations")}</TabsTrigger>
          <TabsTrigger value="portfolios">{t("detail.tabs.portfolios")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.details.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("detail.details.capacity")}</p>
                <p className="text-sm font-medium">{event.capacity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("detail.details.reservationTimeout")}
                </p>
                <p className="text-sm font-medium">
                  {t("detail.details.reservationTimeoutValue", {
                    count: event.reservationTimeoutMinutes,
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("detail.details.registration")}</p>
                <p className="text-sm font-medium">
                  {formatDate(event.registrationStartDate)} —{" "}
                  {formatDate(event.registrationEndDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("detail.details.event")}</p>
                <p className="text-sm font-medium">
                  {formatDate(event.eventStartDate)}
                  {event.eventEndDate
                    ? ` — ${formatDate(event.eventEndDate)}`
                    : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("detail.details.requireConfirmation")}
                </p>
                <p className="text-sm font-medium">
                  {event.requireConfirmation
                    ? t("detail.details.yes")
                    : t("detail.details.no")}
                </p>
              </div>
              {event.description ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">{t("detail.details.description")}</p>
                  <p className="text-sm font-medium">{event.description}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.readiness.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReadinessChecklist eventId={event.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offerings">
          <EventOfferingsPanel eventId={event.id} />
        </TabsContent>

        <TabsContent value="roster">
          <RosterTab eventId={event.id} eventStatus={event.status} />
        </TabsContent>

        <TabsContent value="email-template">
          <EmailTemplateTab eventId={event.id} eventStatus={event.status} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsTab eventId={event.id} />
        </TabsContent>

        <TabsContent value="portfolios">
          <EventPortfoliosPanel eventId={event.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
