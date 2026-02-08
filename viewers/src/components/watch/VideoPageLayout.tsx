"use client";

import React from "react";
import { Calendar, Loader2, Archive } from "lucide-react";
import { useParams } from "next/navigation";
import { MainLayout } from "../layout";
import DaySelector from "./DaySelector";
import VideoPlayerSection from "./VideoPlayerSection";
import EventDetailsSection from "./EventDetailsSection";
import LiveChatSection from "./LiveChatSection";
import SponsorsSection from "./SponsorsSection";
import { GeolocationBlockedMessage } from "./GeolocationBlockedMessage";
import { SecureVideoAccess } from "./SecureVideoAccess";
import { useVideoPageLayout } from "@/hooks/useVideoPageLayout";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";
import { EventsList } from "../ticket";
import { AddToCalendarButton } from "@/components/ticket/AddToCalendarButton";

interface VideoPageLayoutProps {
  videoSrc: string;
  thumbnailSrc: string;
  onVideoEnded: () => void;
  ticketId?: string;
  ticketUrl: string;
}

// Helper function to check if a string is a URL vs HTML embed code
const isUrl = (str: string): boolean => {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  // Check if it starts with http:// or https://
  if (/^https?:\/\//i.test(trimmed)) {
    // If it contains HTML tags, it's not a plain URL
    if (/<[^>]+>/i.test(trimmed)) {
      return false;
    }
    return true;
  }
  return false;
};

const EmbedSection: React.FC<{ embed: string }> = ({ embed }) => {
  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <div
          className="relative w-full"
          style={{
            aspectRatio: "16/9",
            minHeight: "400px",
            position: "relative",
          }}
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            dangerouslySetInnerHTML={{
              __html: embed.replace(
                /<iframe([^>]*)>/gi,
                '<iframe$1 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;">'
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const VideoPageLayout: React.FC<VideoPageLayoutProps> = ({
  videoSrc,
  thumbnailSrc,
  onVideoEnded,
  ticketId,
  ticketUrl,
}) => {
  const params = useParams();
  const ticketUrl = params.ticketUrl as string;
  const { formatDate, formatTime, formatDateTime } = useTimezoneFormat();

  const {
    ticket,
    events,
    selectedDay,
    setSelectedDay,
    selectedEvent,
    isTicketBlocked,
    isEventExpired,
    latestEndDate,
    isEventArchived,
    currentThumbnailSrc,
    currentEmbed,
    videoSrcToUse,
    enableLiveChat,
    isTicketLoading,
    isSettingsLoading,
  } = useVideoPageLayout(ticketId, videoSrc, thumbnailSrc);

  if (!ticketId) {
    return (
      <div className="text-center text-2xl font-bold">Ticket ID is required</div>
    );
  }

  // Show loading while fetching ticket data
  if (isTicketLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (events.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No Events Found
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No events are available for this ticket. Please check back later
                or contact support if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isTicketBlocked) {
    return (
      <MainLayout>
        <GeolocationBlockedMessage
          eventTitle={ticket?.title || "This content"}
          userLocation={null}
        />
      </MainLayout>
    );
  }

  if (isEventArchived) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Content Archived
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                This content has been archived and is no longer available for viewing.
                {selectedEvent?.archive_after && (
                  <>
                    {" "}It was archived on{" "}
                    {formatDate(selectedEvent.archive_after, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isEventExpired) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Event Ended
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {latestEndDate ? (
                  <>
                    This event ended on{" "}
                    {formatDate(latestEndDate.toISOString(), {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </>
                ) : (
                  "This event has ended."
                )}
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        >
          <div className="lg:col-span-3">
            <DaySelector
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              ticketId={ticketId}
              ticketUrl={ticketUrl}
            />
          </div>
        </div>

        {selectedEvent && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {selectedEvent.start_datetime && selectedEvent.end_datetime ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    {formatDateTime(selectedEvent.start_datetime)}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>
                    {formatDateTime(selectedEvent.end_datetime)}
                  </span>
                </div>
              ) : selectedEvent.start_datetime ? (
                <div>
                  <span className="font-medium text-foreground">Start:</span>{" "}
                  {formatDateTime(selectedEvent.start_datetime)}
                </div>
              ) : null}
            </div>
            <AddToCalendarButton
              event={selectedEvent}
              ticketUrl={ticketUrl ? `/${ticketUrl}/watch` : undefined}
            />
          </div>
        )}

        <SecureVideoAccess ticketId={ticketId || ""} eventId={selectedEvent?.id}>
          <div
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            style={
              {
                "--video-height": "calc((100vw - 2rem - 1.5rem) * 0.67 * 9 / 16)",
              } as React.CSSProperties
            }
          >
            <div className="lg:col-span-3">
              {currentEmbed && isUrl(currentEmbed) ? (
                <VideoPlayerSection
                  src={currentEmbed}
                  thumbnailSrc={currentThumbnailSrc}
                  onEnded={onVideoEnded}
                />
              ) : currentEmbed ? (
                <EmbedSection embed={currentEmbed} />
              ) : videoSrcToUse ? (
                <VideoPlayerSection
                  src={videoSrcToUse}
                  thumbnailSrc={currentThumbnailSrc}
                  onEnded={onVideoEnded}
                />
              ) : null}

              {enableLiveChat && (
                <div className="lg:hidden mt-8">
                  <LiveChatSection ticketId={ticketId || ""} />
                </div>
              )}

              <EventDetailsSection event={selectedEvent} />

              <div className="mt-8 space-y-8">
                {ticket?.sponsors && ticket.sponsors.length > 0 && (
                  <SponsorsSection sponsors={ticket.sponsors} />
                )}
              </div>

              {ticket?.events && ticket?.events?.length > 0 && (
                <>
                  <div className="mt-8 sm:mt-8 space-y-8"></div>
                  <EventsList events={ticket.events} title="Events" ticketUrl={ticketUrl} />
                </>
              )}
            </div>

            {enableLiveChat && (
              <div className="hidden lg:block lg:col-span-1">
                <LiveChatSection ticketId={ticketId || ""} />
              </div>
            )}
          </div>
        </SecureVideoAccess>
      </div>
    </MainLayout>
  );
};

export default VideoPageLayout;

