"use client";

import { Search, Grid3x3, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/store/api";

export type ViewMode = "grid" | "table";

interface EventsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EventStatus | "";
  onStatusFilterChange: (value: EventStatus | "") => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function EventsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode = "grid",
  onViewModeChange,
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
        <option value="archived">📦 Archived</option>
      </Select>
      {onViewModeChange && (
        <Button
          variant="outline"
          onClick={() => onViewModeChange(viewMode === "grid" ? "table" : "grid")}
          className="h-12 px-4 border-border bg-secondary/50 hover:bg-secondary rounded-xl gap-2"
        >
          {viewMode === "grid" ? (
            <>
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </>
          ) : (
            <>
              <Grid3x3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
