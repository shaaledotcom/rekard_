"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, sendEmailOtp, verifyEmailOtp } = useAuth();
  const { config, isLoading: tenantLoading } = useTenant();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendEmailOtp(email);
      setSuccess("OTP sent to your email. Please check your inbox.");
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyEmailOtp(email, otpCode);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtpCode("");
    setError("");
    setSuccess("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
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
            {otpSent ? "Enter OTP" : "Login / Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            // Email form
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
                  "Continue with Email"
                )}
              </Button>
            </form>
          ) : (
            // OTP form
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                OTP sent to: <span className="font-medium text-foreground">{email}</span>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
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

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back to home */}
      <Button
        variant="ghost"
        className="mt-6 text-muted-foreground"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );
}

