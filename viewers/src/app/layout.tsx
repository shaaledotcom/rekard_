import type { Metadata } from "next";
import { Open_Sans, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/providers/StoreProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { TenantProvider } from "@/providers/TenantProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { GeolocationProvider } from "@/providers/GeolocationProvider";
import { Toaster } from "@/components/ui/toaster";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Watch Live Events | Rekard",
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
        className={`${openSans.variable} ${instrumentSans.variable} antialiased`}
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

