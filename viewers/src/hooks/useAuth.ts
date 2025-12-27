"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearAuth } from "@/store/slices/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, session, isAuthenticated, isLoading, accessToken } =
    useAppSelector((state) => state.auth);

  // Send OTP to email
  const sendEmailOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return { success: true };
  }, []);

  // Verify email OTP
  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    return data;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch(clearAuth());
  }, [dispatch]);

  // Get current session token for API calls
  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    accessToken,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    getAccessToken,
  };
}

