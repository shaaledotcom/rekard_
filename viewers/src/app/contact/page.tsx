"use client";

import { Mail, Phone, MessageCircle } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactPage() {
  const { config, isLoading } = useTenant();

  const supportChannels = config?.support_channels || [];
  const legalName = config?.legal_name || "Rekard";

  // Extract email and phone from support channels
  const emailChannel = supportChannels.find(
    (ch) => ch.type.toLowerCase() === "email"
  );
  const phoneChannel = supportChannels.find(
    (ch) => ch.type.toLowerCase() === "phone"
  );
  const email = emailChannel?.value || "";
  const phone = phoneChannel?.value || "";

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "phone":
        return <Phone className="h-5 w-5" />;
      case "whatsapp":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const handleContact = (channel: { type: string; value: string }) => {
    switch (channel.type.toLowerCase()) {
      case "phone":
        window.open(`tel:${channel.value}`, "_self");
        break;
      case "email":
        window.open(`mailto:${channel.value}`, "_self");
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/${channel.value.replace(/\D/g, "")}`,
          "_blank"
        );
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
          <p>
            Have questions or need help? We&apos;re here for you. Reach out to us
            through any of the channels below.
          </p>
        </div>

        {/* Email and Phone - Prominently Displayed */}
        {(email || phone) && (
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            {email && (
              <Card className="hover:shadow-md transition-shadow border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium text-foreground mb-4">
                    {email}
                  </p>
                  <Button
                    variant="default"
                    onClick={() => window.open(`mailto:${email}`, "_self")}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            )}

            {phone && (
              <Card className="hover:shadow-md transition-shadow border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium text-foreground mb-4">
                    {phone}
                  </p>
                  <Button
                    variant="default"
                    onClick={() => window.open(`tel:${phone}`, "_self")}
                    className="w-full"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Other Support Channels */}
        {supportChannels.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {supportChannels
              .filter(
                (ch) =>
                  ch.type.toLowerCase() !== "email" &&
                  ch.type.toLowerCase() !== "phone"
              )
              .map((channel, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getIcon(channel.type)}
                      {channel.label || channel.type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{channel.value}</p>
                    <Button
                      variant="outline"
                      onClick={() => handleContact(channel)}
                      className="w-full"
                    >
                      {channel.type.toLowerCase() === "phone"
                        ? "Call Now"
                        : channel.type.toLowerCase() === "whatsapp"
                        ? "Message on WhatsApp"
                        : "Send Email"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : !email && !phone ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For any inquiries, please email us at:
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  window.open("mailto:support@rekard.com", "_self")
                }
                className="w-full"
              >
                support@rekard.com
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {legalName}. All rights reserved.</p>
        </div>
      </div>
    </MainLayout>
  );
}

