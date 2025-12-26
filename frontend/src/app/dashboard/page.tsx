"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { SalesTransactions } from "@/components/billing/SalesTransactions";
import { useGetMeQuery } from "@/store";

function DashboardContent() {
  const { data: meData } = useGetMeQuery();

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
                Here&apos;s your transaction overview and account summary.
              </p>
            </div>
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

          {/* Sales Transactions Ledger */}
          <SalesTransactions />
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
