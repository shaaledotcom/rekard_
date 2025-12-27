"use client";

import { useEffect, ReactNode, createContext, useContext } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setTenantConfig,
  setTenantLoading,
  setTenantError,
  setCurrentDomain,
  TenantConfig,
} from "@/store/slices/tenantSlice";
import { useGetTenantConfigQuery } from "@/store/api";

interface TenantContextType {
  config: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  isCustomDomain: boolean;
}

const TenantContext = createContext<TenantContextType>({
  config: null,
  isLoading: true,
  error: null,
  isCustomDomain: false,
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const dispatch = useAppDispatch();
  const { config, isLoading: storeLoading, error } = useAppSelector(
    (state) => state.tenant
  );

  // Get current domain on client side
  const currentDomain =
    typeof window !== "undefined" ? window.location.host : "";

  // Fetch tenant config
  const {
    data: tenantConfig,
    isLoading: queryLoading,
    error: queryError,
  } = useGetTenantConfigQuery(
    { domain: currentDomain },
    { skip: !currentDomain }
  );

  useEffect(() => {
    if (currentDomain) {
      dispatch(setCurrentDomain(currentDomain));
    }
  }, [currentDomain, dispatch]);

  useEffect(() => {
    dispatch(setTenantLoading(queryLoading));

    if (queryError) {
      dispatch(
        setTenantError(
          "error" in queryError
            ? String(queryError.error)
            : "Failed to load tenant configuration"
        )
      );
    } else if (tenantConfig) {
      dispatch(setTenantConfig(tenantConfig));
    }
  }, [tenantConfig, queryLoading, queryError, dispatch]);

  const isLoading = storeLoading || queryLoading;

  const value: TenantContextType = {
    config,
    isLoading,
    error,
    isCustomDomain: config?.is_custom_domain ?? false,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

