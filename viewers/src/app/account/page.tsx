"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMeQuery, useUpdateMeMutation } from "@/store/api";
import { useAuth } from "@/hooks/useAuth";

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth?returnUrl=${encodeURIComponent("/account")}`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setEmail(me.email || "");
      setPhoneNumber(me.phoneNumber || "");
    }
  }, [me]);

  const hasEmpty = !me?.name?.trim() || !me?.email?.trim() || !me?.phoneNumber?.trim();
  const showForm = hasEmpty || isEditing || !me;

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

  if (authLoading || !isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8 flex items-center justify-center min-h-[40vh]">
          <Skeleton className="h-10 w-48" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <User className="h-7 w-7" />
          My account
        </h1>

        {meLoading ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Account details</CardTitle>
              <CardDescription className="text-muted-foreground">
                {!me
                  ? "Fill in your details below. Your name will be used automatically in live chat on the watch page."
                  : hasEmpty
                    ? "Fill in your details below. Your name will be used automatically in live chat on the watch page."
                    : "Your name is used in live chat on the watch page. You can update your details below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showForm ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Name</Label>
                    <Input
                      id="account-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your display name (used in live chat)"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-email">Email</Label>
                    <Input
                      id="account-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-phone">Phone</Label>
                    <Input
                      id="account-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Your phone number"
                      className="bg-background"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    {!hasEmpty && me && (
                      <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{me?.name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{me?.email || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{me?.phoneNumber || "Not set"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="mt-2">
                    Edit details
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
