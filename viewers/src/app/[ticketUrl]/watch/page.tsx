import { Metadata } from "next";
import { headers } from "next/headers";
import { getTicketByUrlServer, cleanDescription } from "@/lib/server-fetch";
import WatchPageClient from "./WatchPageClient";

type Props = {
  params: Promise<{
    ticketUrl: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketUrl } = await params;
  const ticket = await getTicketByUrlServer(ticketUrl);
  if (!ticket) {
    return {
      title: "Watch Live Events & Video on Demand",
      description: "Stream live events and watch on-demand content",
    };
  }


  const title = ticket.title;

  const description = cleanDescription(ticket.description, 160) || "Watch this event online.";

  const image = ticket.featured_image || "https://cdn.prod.website-files.com/68973a33dcbf85d23e3fdf09/6897400d407ea960e2c945ed_RekardDarkLogo_NEW.png";

  // Get real browser URL dynamically
  const headersList = await headers();
  const host = headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto") ?? "https";

  const url = `${forwardedProto}://${host}/${ticketUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function WatchPage() {
  return <WatchPageClient />;
}