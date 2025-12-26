"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EventStatus } from "@/store/api";

interface EventsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EventStatus | "";
  onStatusFilterChange: (value: EventStatus | "") => void;
}

export function EventsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: EventsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
        <Input
          placeholder="Search your events..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-red-500/50 focus:ring-red-500/20"
        />
      </div>
      <Select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as EventStatus | "")}
        className="h-12 w-full sm:w-48 bg-secondary/50 border-border text-foreground rounded-xl"
      >
        <option value="">All Status</option>
        <option value="draft">📝 Drafts</option>
        <option value="published">🌐 Published</option>
        <option value="live">⚡ Live Now</option>
        <option value="completed">✅ Completed</option>
        <option value="cancelled">❌ Cancelled</option>
      </Select>
    </div>
  );
}
