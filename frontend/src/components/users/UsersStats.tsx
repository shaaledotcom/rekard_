"use client";

import { Users, CheckCircle, Clock, XCircle, UserCheck } from "lucide-react";
import type { AccessStats } from "@/store/api";

interface UsersStatsProps {
  stats: AccessStats | undefined;
  isLoading: boolean;
}

export function UsersStats({ stats, isLoading }: UsersStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-4">
            <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
            <div className="h-8 bg-secondary rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    { 
      label: "Total Grants", 
      value: stats.total_grants, 
      icon: Users, 
      color: "violet",
      bg: "bg-violet-500/10",
      iconColor: "text-violet-500"
    },
    { 
      label: "Active", 
      value: stats.active_grants, 
      icon: CheckCircle, 
      color: "emerald",
      bg: "bg-emerald-500/10",
      iconColor: "text-emerald-500"
    },
    { 
      label: "Used", 
      value: stats.used_grants, 
      icon: UserCheck, 
      color: "blue",
      bg: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    { 
      label: "Expired", 
      value: stats.expired_grants, 
      icon: Clock, 
      color: "yellow",
      bg: "bg-yellow-500/10",
      iconColor: "text-yellow-500"
    },
    { 
      label: "Revoked", 
      value: stats.revoked_grants, 
      icon: XCircle, 
      color: "red",
      bg: "bg-red-500/10",
      iconColor: "text-red-500"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {statItems.map((item) => (
        <div 
          key={item.label}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-violet-500/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

