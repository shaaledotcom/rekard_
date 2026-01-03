"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/auth/OtpInput";
import { useAuthPage } from "@/hooks/useAuthPage";
import { useTenant } from "@/hooks/useTenant";

export default function AuthPage() {
  const router = useRouter();
  const { config, isLoading: tenantLoading } = useTenant();
  const {
    email,
    setEmail,
    otpCode,
    setOtpCode,
    loading,
    error,
    success,
    otpSent,
    authLoading,
    handleSendOtp,
    handleVerifyOtp,
    handleChangeEmail,
  } = useAuthPage();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        {!tenantLoading && config?.logo_url && (
          <Image
            src={config.logo_url}
            alt={config.legal_name || "Logo"}
            width={160}
            height={60}
            className="h-14 w-auto object-contain"
          />
        )}
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {otpSent ? "Enter OTP" : "Login With OTP"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "GET OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                OTP sent to: <span className="font-medium text-foreground">{email}</span>
              </div>
              <div className="text-center text-xs text-muted-foreground/70 mb-2">
               You would have received an email from live@rekard.com with OTP. Check spam folder.
              </div>

              <div className="space-y-2">
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeEmail}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Change Email
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              </div>
            </form>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="mt-6 text-muted-foreground"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}

