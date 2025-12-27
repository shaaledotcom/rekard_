"use client";

import { LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { config, isLoading: tenantLoading } = useTenant();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const isLoading = authLoading || tenantLoading;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {tenantLoading || !config?.logo_url ? (
              <Skeleton className="h-10 w-10 rounded-md" />
            ) : (
              <Image
                src={config.logo_url}
                alt={config.legal_name || "Logo"}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
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
                onClick={() => router.push("/auth")}
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

