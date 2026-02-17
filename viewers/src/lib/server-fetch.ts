import { PublicTicketDetails } from "@/store/api/dashboardApi";

export async function getTicketByUrlServer(
    ticketUrl: string
): Promise<PublicTicketDetails | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const cleanUrl = ticketUrl.startsWith("/")
            ? ticketUrl.slice(1)
            : ticketUrl;

        const res = await fetch(
            `${baseUrl}/v1/discover/tickets/by-url/${cleanUrl}`,
            {
                cache: "no-store",
            }
        );

        if (!res.ok) return null;
        const json = await res.json();

        return json?.data ?? null; // because your API wraps in { success, data }
    } catch (error) {
        console.error("Metadata fetch failed:", error);
        return null;
    }
}


export function cleanDescription(html?: string, limit: number = 160) {
    if (!html) return "";

    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, "");

    // Remove extra spaces
    const cleaned = text.replace(/\s+/g, " ").trim();

    // Limit characters
    return cleaned.length > limit
        ? cleaned.substring(0, limit) + "..."
        : cleaned;
}