"use client";

import React from "react";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import {
  TrailerSection,
  EventDetailsSection,
  SponsorsSection,
  EventInformation,
  EventsList,
  SocialShareDropdown,
} from "@/components/ticket";
import { useTicketDetail } from "@/hooks/useTicketDetail";

export default function TicketDetailPage() {
  const {
    ticketUrl,
    ticket,
    isLoading,
    error,
    trailerMedia,
    eventInfo,
    currentUrl,
  } = useTicketDetail();

  if (!ticketUrl) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-7xl px-2 sm:px-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Invalid ticket URL</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-7xl px-2 sm:px-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading ticket details...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !ticket || !eventInfo) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-7xl px-2 sm:px-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Failed to load ticket details</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 w-full">
        <div className="lg:col-span-3 order-2 lg:order-1 w-full overflow-visible">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 capitalize">
                {eventInfo.title}
              </h1>
              <SocialShareDropdown
                url={currentUrl}
                title={eventInfo.title}
                description={ticket.description}
              />
            </div>
          </div>

          {eventInfo.lastDate && (
            <Badge variant="secondary" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              LAST DATE TO WATCH: {eventInfo.lastDate}
            </Badge>
          )}

          <TrailerSection media={trailerMedia} />
          <EventDetailsSection description={ticket.description || ""} />

          {ticket.sponsors && ticket.sponsors.length > 0 && (
            <>
              <div className="mt-4 sm:mt-8"></div>
              <SponsorsSection sponsors={ticket.sponsors} />
            </>
          )}

          {ticket.events && ticket.events.length > 0 && (
            <>
              <div className="mt-4 sm:mt-8"></div>
              <EventsList events={ticket.events} title="Events" />
            </>
          )}
        </div>

        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-4 sm:top-8">
            <EventInformation
              eventInfo={eventInfo}
              ticketId={ticket.id.toString()}
              ticketUrl={ticketUrl}
              events={ticket.events || []}
              fullEvents={ticket.events || []}
              ticketPrice={ticket.price}
              ticketCurrency={ticket.currency}
              ticketPricing={ticket.pricing}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

