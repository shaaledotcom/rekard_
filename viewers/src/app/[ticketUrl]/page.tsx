"use client";

import React from "react";
import { useParams } from "next/navigation";
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
import { useGetTicketByUrlQuery } from "@/store/api";
import { useCurrencyFormat } from "@/hooks/useCurrencyFormat";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketUrl = params.ticketUrl as string;
  const { formatPriceWithCurrency } = useCurrencyFormat();
  const { formatDate, formatTime } = useTimezoneFormat();

  const urlWithSlash = ticketUrl?.startsWith("/") ? ticketUrl : `/${ticketUrl}`;

  const { data: ticket, isLoading, error } = useGetTicketByUrlQuery(urlWithSlash, {
    skip: !ticketUrl,
  });

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

  if (error || !ticket) {
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

  // Build trailer media items
  const trailerMedia = [
    ...(ticket.featured_video
      ? [
          {
            id: "video",
            type: "video" as const,
            src: ticket.featured_video,
            thumbnail: ticket.featured_image,
          },
        ]
      : []),
    ...(ticket.featured_image
      ? [
          {
            id: "image",
            type: "image" as const,
            src: ticket.featured_image,
            alt: `${ticket.title} featured image`,
          },
        ]
      : []),
  ];

  // Build event info for the sidebar
  const eventInfo = {
    title: ticket.title,
    lastDate:
      ticket.events && ticket.events.length > 0
        ? (() => {
            const latestEndDate = ticket.events.reduce((latest, event) => {
              if (event.end_datetime) {
                const eventEndDate = new Date(event.end_datetime);
                return latest > eventEndDate ? latest : eventEndDate;
              }
              return latest;
            }, new Date(0));
            return latestEndDate > new Date(0)
              ? formatDate(latestEndDate.toISOString(), {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).toUpperCase()
              : "";
          })()
        : "",
    date: ticket.events?.[0]?.start_datetime
      ? formatDate(ticket.events[0].start_datetime, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "",
    time: ticket.events?.[0]?.start_datetime
      ? formatTime(ticket.events[0].start_datetime)
      : "",
    duration:
      ticket.events && ticket.events.length > 0
        ? (() => {
            const totalDuration = ticket.events.reduce((total, event) => {
              if (event.start_datetime && event.end_datetime) {
                return (
                  total +
                  (new Date(event.end_datetime).getTime() -
                    new Date(event.start_datetime).getTime())
                );
              }
              return total;
            }, 0);
            return totalDuration > 0
              ? `${Math.round(totalDuration / (1000 * 60 * 60))} hours`
              : "TBD";
          })()
        : "TBD",
    language: "English",
    location: "Online",
    price: formatPriceWithCurrency(
      ticket.price,
      ticket.currency,
      ticket.pricing,
      ticket.currency
    ),
    image: ticket.thumbnail_image_portrait || ticket.featured_image || "",
  };

  // Get the current URL for sharing
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        {/* Main content */}
        <div className="lg:col-span-3 order-2 lg:order-1">
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

          {ticket.events && ticket.events.length > 1 && (
            <>
              <div className="mt-4 sm:mt-8"></div>
              <EventsList events={ticket.events} title="Included Events" />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-4 sm:top-8">
            <EventInformation
              eventInfo={eventInfo}
              ticketId={ticket.id.toString()}
              ticketUrl={ticketUrl}
              events={ticket.events || []}
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

