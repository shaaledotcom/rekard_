"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "./OtpInput";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type LoginStep = "input" | "otp" | "success";

export function LoginForm() {
  const router = useRouter();
  const { sendEmailOtp, verifyEmailOtp } = useAuth();

  const [step, setStep] = React.useState<LoginStep>("input");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      await sendEmailOtp(email);
      setStep("otp");
      setCountdown(60);
      toast({
        title: "OTP Sent!",
        description: "We've sent a verification code to your email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      await verifyEmailOtp(email, otp);
      setStep("success");
      toast({
        title: "Welcome!",
        description: "You've been successfully logged in.",
      });
      // Redirect after a brief delay
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error) {
      toast({
        title: "Invalid OTP",
        description: "Please check the code and try again.",
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  const handleBack = () => {
    setStep("input");
    setOtp("");
  };

  // Basic email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground">R</span>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome to Rekard</CardTitle>
        <CardDescription>
          {step === "input" && "Enter your email to continue"}
          {step === "otp" && `Enter the code sent to ${email}`}
          {step === "success" && "You're all set!"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button
              className="w-full h-11"
              onClick={handleSendOtp}
              disabled={!isValidEmail || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              />
              <p className="text-center text-sm text-muted-foreground">
                {countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-foreground hover:underline"
                    disabled={isLoading}
                  >
                    Resend code
                  </button>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                className="flex-1 h-11"
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
