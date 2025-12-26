"use client";

import { Calendar, Ticket, BarChart3, Settings, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { useGetMeQuery } from "@/store";
import Link from "next/link";

function DashboardContent() {
  const { data: meData } = useGetMeQuery();

  const quickActions = [
    { icon: Calendar, label: "Events", description: "Manage your events", href: "/producer/events" },
    { icon: Ticket, label: "Tickets", description: "View ticket sales", href: "/tickets" },
    { icon: BarChart3, label: "Analytics", description: "View performance", href: "/analytics" },
    { icon: Settings, label: "Settings", description: "Configure your account", href: "/settings" },
  ];

  const stats = [
    { label: "Total Events", value: "12", change: "+2", trend: "up" },
    { label: "Tickets Sold", value: "1,847", change: "+124", trend: "up" },
    { label: "Revenue", value: "₹1.2L", change: "+18%", trend: "up" },
    { label: "Active Viewers", value: "342", change: "+56", trend: "up" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main content */}
      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <div className="space-y-8">
          {/* Welcome section */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back{meData?.data?.email ? `, ${meData.data.email.split("@")[0]}` : ""}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Here&apos;s what&apos;s happening with your events today.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card border-border hover:border-foreground/20">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-end justify-between mt-2">
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 text-foreground text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>{stat.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User info card */}
          {meData?.data && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Your Account</CardTitle>
                <CardDescription className="text-muted-foreground">Account details and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{meData.data.email || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{meData.data.phoneNumber || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium text-foreground capitalize">{meData.data.role || "User"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">App ID</p>
                    <p className="font-medium text-foreground">{meData.data.app_id || "public"}</p>
                  </div>
                </div>
                {meData.data.permissions && meData.data.permissions.length > 0 && (
                  <>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {meData.data.permissions.slice(0, 8).map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 text-xs rounded-md bg-secondary text-foreground border border-border"
                          >
                            {perm}
                          </span>
                        ))}
                        {meData.data.permissions.length > 8 && (
                          <span className="px-2 py-1 text-xs rounded-md bg-secondary text-muted-foreground">
                            +{meData.data.permissions.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Card className="h-full cursor-pointer bg-card border-border hover:border-foreground/20 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative p-3 rounded-xl bg-secondary">
                          <action.icon className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{action.label}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
