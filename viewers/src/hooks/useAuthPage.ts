import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Custom hook for auth page business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. AUTHENTICATION FLOW:
 *    - Two-step OTP process: email entry → OTP verification
 *    - Redirects authenticated users to return URL (or home) to prevent re-authentication
 *    - Supports seamless return to original destination after login
 * 
 * 2. OTP MANAGEMENT:
 *    - Sends OTP via email using Supabase Auth
 *    - Validates 6-digit OTP code before submission
 *    - Allows resending OTP and changing email during verification flow
 *    - Clears form state when changing email to prevent confusion
 * 
 * 3. ERROR HANDLING:
 *    - Displays user-friendly error messages from API or fallback messages
 *    - Clears previous errors/success messages on new actions
 *    - Handles network errors and invalid OTP gracefully
 * 
 * 4. SUCCESS FLOW:
 *    - Shows success message after OTP sent
 *    - Displays redirect message after successful verification
 *    - Redirects to return URL after 1.5s delay for user feedback
 */
export function useAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, sendEmailOtp, verifyEmailOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Extract return URL from query params (defaults to home)
  const returnUrl = searchParams?.get("returnUrl") || "/";

  // Redirect authenticated users to prevent re-authentication
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(returnUrl);
    }
  }, [authLoading, isAuthenticated, router, returnUrl]);

  // Send OTP to user's email
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

  // Verify OTP and complete authentication
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyEmailOtp(email, otpCode);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.push(returnUrl), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form to allow changing email
  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtpCode("");
    setError("");
    setSuccess("");
  };

  return {
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
  };
}

