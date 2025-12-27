"use client";

import { useTenant as useTenantContext } from "@/providers/TenantProvider";

/**
 * Hook to access tenant configuration
 * Use this in components that need tenant-specific data
 */
export function useTenant() {
  return useTenantContext();
}

