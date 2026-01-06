"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { SalesTransactions } from "@/components/billing/SalesTransactions";
import { SalesReport } from "@/components/billing/SalesReport";
import { useGetMeQuery } from "@/store";

function DashboardContent() {
  const { data: meData } = useGetMeQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main content */}
      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <div className="space-y-8">
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

          {/* Tabs for Sales Report and Transactions */}
          <Tabs defaultValue="sales-report" className="w-full">
            <TabsList className="bg-secondary border-border">
              <TabsTrigger value="sales-report">Sales Report</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="sales-report" className="mt-6">
              <SalesReport />
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <SalesTransactions />
            </TabsContent>
          </Tabs>
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
