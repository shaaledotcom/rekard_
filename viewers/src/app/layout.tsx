import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { TenantProvider } from "@/providers/TenantProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { GeolocationProvider } from "@/providers/GeolocationProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Watch Live Events & Video on Demand",
  description: "Stream live events and watch on-demand content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="light">
          <StoreProvider>
            <AuthProvider>
              <TenantProvider>
                <GeolocationProvider>
                  {children}
                  <Toaster />
                </GeolocationProvider>
              </TenantProvider>
            </AuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

