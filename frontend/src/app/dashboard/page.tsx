"use client";

import { motion } from "framer-motion";
import { LogOut, User, Settings, Calendar, Ticket, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useGetMeQuery } from "@/store";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { data: meData, isLoading: isLoadingMe } = useGetMeQuery();

  const quickActions = [
    { icon: Calendar, label: "Events", description: "Manage your events", href: "/events" },
    { icon: Ticket, label: "Tickets", description: "View ticket sales", href: "/tickets" },
    { icon: BarChart3, label: "Analytics", description: "View performance", href: "/analytics" },
    { icon: Settings, label: "Settings", description: "Configure your account", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">R</span>
            </div>
            <span className="text-xl font-semibold">Rekard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email || user?.phone || "User"}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome section */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{meData?.data?.email ? `, ${meData.data.email.split("@")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your events today.
            </p>
          </motion.div>

          {/* User info card */}
          {meData?.data && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Account</CardTitle>
                  <CardDescription>Account details and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{meData.data.email || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{meData.data.phoneNumber || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{meData.data.role || "User"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">App ID</p>
                      <p className="font-medium">{meData.data.app_id || "public"}</p>
                    </div>
                  </div>
                  {meData.data.permissions && meData.data.permissions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Permissions</p>
                        <div className="flex flex-wrap gap-2">
                          {meData.data.permissions.slice(0, 8).map((perm) => (
                            <span
                              key={perm}
                              className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary"
                            >
                              {perm}
                            </span>
                          ))}
                          {meData.data.permissions.length > 8 && (
                            <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground">
                              +{meData.data.permissions.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Card
                  key={action.label}
                  className="cursor-pointer hover:bg-accent/50 transition-colors group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{action.label}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Stats placeholder */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Events", value: "0", change: "+0%" },
                { label: "Tickets Sold", value: "0", change: "+0%" },
                { label: "Revenue", value: "₹0", change: "+0%" },
                { label: "Active Users", value: "0", change: "+0%" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change} from last month</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </motion.div>
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

