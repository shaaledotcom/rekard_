"use client";

import { motion } from "framer-motion";
import { Calendar, Ticket, BarChart3, Settings, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { useGetMeQuery } from "@/store";
import Link from "next/link";

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
  const { data: meData } = useGetMeQuery();

  const quickActions = [
    { icon: Calendar, label: "Events", description: "Manage your events", href: "/producer/events", color: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/25" },
    { icon: Ticket, label: "Tickets", description: "View ticket sales", href: "/tickets", color: "from-purple-500 to-purple-600", shadow: "shadow-purple-500/25" },
    { icon: BarChart3, label: "Analytics", description: "View performance", href: "/analytics", color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25" },
    { icon: Settings, label: "Settings", description: "Configure your account", href: "/settings", color: "from-orange-500 to-orange-600", shadow: "shadow-orange-500/25" },
  ];

  const stats = [
    { label: "Total Events", value: "12", change: "+2", trend: "up" },
    { label: "Tickets Sold", value: "1,847", change: "+124", trend: "up" },
    { label: "Revenue", value: "₹1.2L", change: "+18%", trend: "up" },
    { label: "Active Viewers", value: "342", change: "+56", trend: "up" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      {/* Main content */}
      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome section */}
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">
                  Welcome back{meData?.data?.email ? `, ${meData.data.email.split("@")[0]}` : ""}!
                </h1>
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-white/50 mt-1">
                Here&apos;s what&apos;s happening with your events today.
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
                    <CardContent className="p-6">
                      <p className="text-sm text-white/50">{stat.label}</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <div className="flex items-center gap-1 text-emerald-400 text-sm">
                          <TrendingUp className="h-4 w-4" />
                          <span>{stat.change}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* User info card */}
          {meData?.data && (
            <motion.div variants={itemVariants}>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Your Account</CardTitle>
                  <CardDescription className="text-white/50">Account details and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-white/50">Email</p>
                      <p className="font-medium text-white">{meData.data.email || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Phone</p>
                      <p className="font-medium text-white">{meData.data.phoneNumber || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Role</p>
                      <p className="font-medium text-white capitalize">{meData.data.role || "User"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50">App ID</p>
                      <p className="font-medium text-white">{meData.data.app_id || "public"}</p>
                    </div>
                  </div>
                  {meData.data.permissions && meData.data.permissions.length > 0 && (
                    <>
                      <Separator className="bg-white/10" />
                      <div>
                        <p className="text-sm text-white/50 mb-2">Permissions</p>
                        <div className="flex flex-wrap gap-2">
                          {meData.data.permissions.slice(0, 8).map((perm) => (
                            <span
                              key={perm}
                              className="px-2 py-1 text-xs rounded-md bg-red-500/10 text-red-400 border border-red-500/20"
                            >
                              {perm}
                            </span>
                          ))}
                          {meData.data.permissions.length > 8 && (
                            <span className="px-2 py-1 text-xs rounded-md bg-white/5 text-white/50">
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
            <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={action.href}>
                    <Card className="h-full cursor-pointer bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`relative p-3 rounded-xl bg-gradient-to-br ${action.color} ${action.shadow} shadow-lg`}>
                            <action.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white group-hover:text-white/90">{action.label}</h3>
                            <p className="text-sm text-white/50">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
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
