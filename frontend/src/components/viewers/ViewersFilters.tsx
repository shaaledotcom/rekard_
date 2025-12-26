"use client";

import { Search, UserPlus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ViewerAccessStatus } from "@/store/api";

interface ViewersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ViewerAccessStatus | "";
  onStatusFilterChange: (value: ViewerAccessStatus | "") => void;
  onGrantAccess: () => void;
  onBulkImport: () => void;
}

export function ViewersFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onGrantAccess,
  onBulkImport,
}: ViewersFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Title and actions row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Viewer Access
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage who can access your tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onBulkImport}
            variant="outline"
            className="border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            onClick={onGrantAccess}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        </div>
      </div>

      {/* Search and filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as ViewerAccessStatus | "")}
          className="h-12 w-full sm:w-48 bg-secondary/50 border-border text-foreground rounded-xl"
        >
          <option value="">All Status</option>
          <option value="active">✅ Active</option>
          <option value="used">✓ Used</option>
          <option value="expired">⏰ Expired</option>
          <option value="revoked">🚫 Revoked</option>
        </Select>
      </div>
    </div>
  );
}

