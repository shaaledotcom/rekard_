"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Ticket,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Zap,
  CreditCard,
  Globe,
  Users,
  LayoutDashboard,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/providers/ThemeProvider";
import { useGetUserWalletQuery } from "@/store/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/producer/events", label: "Events", icon: Calendar },
  { href: "/producer/tickets", label: "Tickets", icon: Ticket },
  { href: "/producer/users", label: "Users", icon: Users },
  { href: "/producer/platform", label: "Platform", icon: Globe },
  { href: "/producer/billing", label: "Billing", icon: CreditCard },
];

const themes = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const { data: walletData } = useGetUserWalletQuery();
  const ticketBalance = walletData?.data?.ticket_balance || 0;

  const isActive = (href: string) => pathname?.startsWith(href);
  
  const currentTheme = themes.find((t) => t.value === theme) || themes[2];

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Border */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        
        {/* Background */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
        
        <nav className="relative container mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                        active
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="relative">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Profile & Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Ticket Balance */}
              <Link
                href="/producer/billing"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted border border-border transition-colors"
              >
                <Ticket className="h-4 w-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {ticketBalance.toLocaleString()}
                </span>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary hover:bg-muted border border-border"
                >
                  <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
                    <User className="h-4 w-4 text-background" />
                  </div>
                  <span className="text-sm text-foreground max-w-[120px] truncate">
                    {user?.email?.split("@")[0] || user?.phone || "User"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {profileMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setThemeMenuOpen(false);
                      }}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 z-50 py-2 bg-card rounded-xl border border-border shadow-xl">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.email || user?.phone || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Producer Account</p>
                      </div>
                      
                      {/* Theme Selection */}
                      <div className="py-1 border-b border-border">
                        <div className="px-4 py-2">
                          <p className="text-xs text-muted-foreground mb-2">Theme</p>
                          <div className="relative">
                            <button
                              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-muted text-sm text-foreground"
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const Icon = currentTheme.icon;
                                  return <Icon className="h-4 w-4" />;
                                })()}
                                <span>{currentTheme.label}</span>
                              </div>
                              <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${themeMenuOpen ? "rotate-180" : ""}`} />
                            </button>
                            
                            {themeMenuOpen && (
                              <div className="absolute left-0 right-0 mt-1 py-1 bg-card rounded-lg border border-border shadow-lg z-10">
                                {themes.map((t) => {
                                  const Icon = t.icon;
                                  const isActive = theme === t.value;
                                  return (
                                    <button
                                      key={t.value}
                                      onClick={() => {
                                        setTheme(t.value);
                                        setThemeMenuOpen(false);
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                        isActive 
                                          ? "bg-secondary text-foreground" 
                                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                      }`}
                                    >
                                      <Icon className="h-4 w-4" />
                                      {t.label}
                                      {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Ticket Balance */}
            <Link
              href="/producer/billing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary border border-border"
            >
              <Ticket className="h-5 w-5" />
              <span>Tickets: {ticketBalance.toLocaleString()}</span>
            </Link>

            {/* Mobile Theme Selection */}
            <div className="pt-4 mt-4 border-t border-border">
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground mb-2">Theme</p>
                <div className="space-y-1">
                  {themes.map((t) => {
                    const Icon = t.icon;
                    const isActive = theme === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => {
                          setTheme(t.value);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive 
                            ? "bg-secondary text-foreground" 
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile User Section */}
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                  <User className="h-5 w-5 text-background" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user?.email?.split("@")[0] || user?.phone || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">Producer Account</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

