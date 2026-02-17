"use client";

import { LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { config, isLoading: tenantLoading, isCustomDomain } = useTenant();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleLogin = () => {
    // Include current path as return URL, but exclude auth page itself
    const returnUrl = pathname && pathname !== "/auth" ? encodeURIComponent(pathname) : undefined;
    const authUrl = returnUrl ? `/auth?returnUrl=${returnUrl}` : "/auth";
    router.push(authUrl);
  };

  const isLoading = authLoading || tenantLoading;

  const logoHeight = isCustomDomain ? "h-10" : "h-10";
  const headerHeight = isCustomDomain ? "h-16" : "h-16";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className={`flex ${headerHeight} items-center justify-between`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {tenantLoading || !config?.logo_url ? (
              <Skeleton className={`${logoHeight} w-auto rounded-md`} />
            ) : (
              <Image
                src={config.logo_url}
                alt={config.legal_name || "Logo"}
                width={isCustomDomain ? 180 : 120}
                height={isCustomDomain ? 56 : 40}
                className={`${logoHeight} w-auto object-contain`}
              />
            )}
          </Link>

          {/* Right side - Auth */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">
                    {user?.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span>Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

