"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetSalesReportQuery,
  type SalesReportEntry,
} from "@/store/api";
import { useAppSelector } from "@/store";
import { config } from "@/lib/config";
import {
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Gift,
  Filter,
  Loader2,
  FileText,
  Download,
} from "lucide-react";
import { formatDateLocal, formatTimeLocal } from "@/lib/datetime";

type TimeRange = "7d" | "30d" | "90d" | "all";
type SalesTypeFilter = "all" | "purchased" | "granted";

export function SalesReport() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [typeFilter, setTypeFilter] = useState<SalesTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate date range
  const dateRange = useMemo(() => {
    if (timeRange === "all") return { start_date: undefined, end_date: undefined };

    const now = new Date();
    const daysMap: Record<TimeRange, number> = { "7d": 7, "30d": 30, "90d": 90, "all": 0 };
    const startDate = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);
    return {
      start_date: startDate.toISOString().split("T")[0],
      end_date: undefined,
    };
  }, [timeRange]);

  const { data: salesData, isLoading } = useGetSalesReportQuery({
    type: typeFilter === "all" ? undefined : typeFilter,
    ...dateRange,
    page: currentPage,
    page_size: itemsPerPage,
    sort_by: "date",
    sort_order: "desc",
  });


  // Filter by search query (client-side)
  const filteredEntries = useMemo(() => {
    if (!salesData?.data) return [];
    if (!searchQuery) return salesData.data;

    const query = searchQuery.toLowerCase();
    return salesData.data.filter(
      (entry: SalesReportEntry) =>
        entry.user_email.toLowerCase().includes(query) ||
        entry.ticket_title.toLowerCase().includes(query) ||
        entry.order_number?.toLowerCase().includes(query)
    );
  }, [salesData?.data, searchQuery]);

  const totalPages = salesData?.total_pages || 1;

  const formatCurrency = (amount: number, currency: string = "INR") => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return formatted.replace(/US\$/g, "$");
  };

  const formatDate = (dateString: string) => {
    return formatDateLocal(dateString, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return formatTimeLocal(dateString, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const accessToken = useAppSelector((state) => state.auth.accessToken);

  // CSV Export functionality
  const exportToCSV = async () => {
    // Fetch all data for export
    const exportQuery = {
      type: typeFilter === "all" ? undefined : typeFilter,
      ...dateRange,
      page: 1,
      page_size: 10000,
      sort_by: "date",
      sort_order: "desc" as const,
    };

    try {
      // Build query string
      const searchParams = new URLSearchParams();
      if (exportQuery.type) searchParams.append("type", exportQuery.type);
      if (exportQuery.start_date) searchParams.append("start_date", exportQuery.start_date);
      if (exportQuery.end_date) searchParams.append("end_date", exportQuery.end_date);
      if (exportQuery.page) searchParams.append("page", exportQuery.page.toString());
      if (exportQuery.page_size) searchParams.append("page_size", exportQuery.page_size.toString());
      if (exportQuery.sort_by) searchParams.append("sort_by", exportQuery.sort_by);
      if (exportQuery.sort_order) searchParams.append("sort_order", exportQuery.sort_order);

      const queryString = searchParams.toString();
      const apiUrl = `${config.apiUrl}/v1/producer/billing/sales-report${queryString ? `?${queryString}` : ""}`;

      // Fetch with auth headers
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": accessToken ? `Bearer ${accessToken}` : "",
          "X-Service": "producer",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }

      const data = await response.json();
      let entriesToExport = data.data || [];

      // Apply client-side search filter if applicable
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        entriesToExport = entriesToExport.filter(
          (entry: SalesReportEntry) =>
            entry.user_email.toLowerCase().includes(query) ||
            entry.ticket_title.toLowerCase().includes(query) ||
            entry.order_number?.toLowerCase().includes(query)
        );
      }

      // Convert to CSV
      const headers = [
        "Date",
        "Time",
        "User Email",
        "Ticket Title",
        "Order Number",
        "Type",
        "Quantity",
        "Amount",
        "Currency",
      ];

      const csvRows = [
        headers.join(","),
        ...entriesToExport.map((entry: SalesReportEntry) => {
          const row = [
            formatDate(entry.date),
            formatTime(entry.date),
            `"${entry.user_email.replace(/"/g, '""')}"`,
            `"${entry.ticket_title.replace(/"/g, '""')}"`,
            entry.order_number ? `"${entry.order_number.replace(/"/g, '""')}"` : "",
            entry.type === "purchased" ? "Sold" : "Complimentary",
            entry.quantity.toString(),
            entry.amount !== undefined ? entry.amount.toString() : "",
            entry.currency || "INR",
          ];
          return row.join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Generate filename with date range
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `sales-report-${dateStr}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export sales data. Please try again.");
    }
  };

  // Summary stats
  const stats = useMemo(() => {
    if (!salesData?.data) {
      return {
        totalPurchased: 0,
        totalGranted: 0,
        totalRevenue: 0,
        purchasedCount: 0,
        grantedCount: 0,
      };
    }

    const purchased = salesData.data.filter((e: SalesReportEntry) => e.type === "purchased");
    const granted = salesData.data.filter((e: SalesReportEntry) => e.type === "granted");

    return {
      totalPurchased: purchased.reduce((sum: number, e: SalesReportEntry) => sum + e.quantity, 0),
      totalGranted: granted.reduce((sum: number, e: SalesReportEntry) => sum + e.quantity, 0),
      totalRevenue: purchased.reduce((sum: number, e: SalesReportEntry) => sum + (e.amount || 0), 0),
      purchasedCount: purchased.length,
      grantedCount: granted.length,
    };
  }, [salesData?.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground">Loading sales report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                 Sales
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.purchasedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalPurchased} tickets
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Complimentary Access
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.grantedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalGranted} tickets
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Gift className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From sales
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total tickets
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.purchasedCount + stats.grantedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All entries
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Time Range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeRange === range
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range === "all" ? "All" : range}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                {([
                  { value: "all", label: "All" },
                  { value: "purchased", label: "Sales" },
                  { value: "granted", label: "Complimentary" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTypeFilter(option.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      typeFilter === option.value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by email, ticket..."
                className="pl-10 h-9 bg-secondary border-border text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Report Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sales
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {salesData?.total || 0} entries
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="h-8 gap-2"
                disabled={isLoading || !salesData?.data || salesData.data.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-xs">Export CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-secondary/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">User Email</div>
            <div className="col-span-3">Ticket</div>
            <div className="col-span-1 text-center">Type</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No sales found</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try adjusting your filters or time range
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors items-center"
                >
                  {/* Date */}
                  <div className="col-span-2">
                    <p className="text-sm text-foreground font-medium">
                      {formatDate(entry.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(entry.date)}
                    </p>
                  </div>

                  {/* User Email */}
                  <div className="col-span-3">
                    <p className="text-sm text-foreground truncate">
                      {entry.user_email}
                    </p>
                  </div>

                  {/* Ticket */}
                  <div className="col-span-3">
                    <p className="text-sm text-foreground font-medium truncate">
                      {entry.ticket_title}
                    </p>
                    {entry.order_number && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {entry.order_number}
                      </p>
                    )}
                  </div>

                  {/* Type */}
                  <div className="col-span-1 text-center">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${
                        entry.type === "purchased"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-purple-500/10 text-purple-500"
                      }`}
                    >
                      {entry.type === "purchased" ? (
                        <ShoppingCart className="h-3 w-3 inline mr-1" />
                      ) : (
                        <Gift className="h-3 w-3 inline mr-1" />
                      )}
                      {entry.type === "purchased" ? "Sold" : "Complimentary"}
                    </Badge>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 text-right">
                    <p className="text-sm text-foreground font-medium">
                      {entry.quantity}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    {entry.amount !== undefined ? (
                      <p className="text-sm font-semibold text-emerald-500">
                        {formatCurrency(entry.amount, entry.currency)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, salesData?.total || 0)} of{" "}
                {salesData?.total || 0} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 text-xs font-medium rounded-md transition-colors ${
                          currentPage === pageNum
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

