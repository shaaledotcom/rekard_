"use client";

import { useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAppDispatch } from "@/store/hooks";
import { setAuth, clearAuth, setLoading } from "@/store/slices/authSlice";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      dispatch(setLoading(true));
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        dispatch(setAuth({ user: session?.user || null, session }));
      } catch (error) {
        console.error("Error getting session:", error);
        dispatch(clearAuth());
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      dispatch(setAuth({ user: session?.user || null, session }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}

