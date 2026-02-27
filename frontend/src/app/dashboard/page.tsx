"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { SalesTransactions } from "@/components/billing/SalesTransactions";
import { SalesReport } from "@/components/billing/SalesReport";
import { useGetMeQuery, useUpdateMeMutation } from "@/store";

function DashboardContent() {
  const { data: meData } = useGetMeQuery();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const me = meData?.data;
  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setEmail(me.email || "");
      setPhoneNumber(me.phoneNumber || "");
    }
  }, [me]);

  const hasEmpty = !me?.name?.trim() || !me?.email?.trim() || !me?.phoneNumber?.trim();
  const showForm = hasEmpty || isEditing;

  const handleSave = async () => {
    try {
      await updateMe({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      }).unwrap();
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

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
                <CardTitle className="text-lg text-foreground">My account</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {hasEmpty
                    ? "Fill in your details below. Your name is used in live chat on the watch page."
                    : "Account details and permissions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showForm ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dashboard-name">Name</Label>
                        <Input
                          id="dashboard-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Display name (used in live chat)"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dashboard-email">Email</Label>
                        <Input
                          id="dashboard-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dashboard-phone">Phone</Label>
                        <Input
                          id="dashboard-phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Phone number"
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      {!hasEmpty && (
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{meData.data.name || "Not set"}</p>
                  </div>
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
                )}
                {!showForm && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit details
                  </Button>
                )}
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
              <TabsTrigger value="sales-report">Sales</TabsTrigger>
              <TabsTrigger value="transactions">Ticket Ledger</TabsTrigger>
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
