"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetWalletTransactionsQuery,
  type WalletTransaction,
} from "@/store/api";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Ticket,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  FileText,
  Filter,
  Download,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDateLocal, formatTimeLocal } from "@/lib/datetime";

type TimeRange = "7d" | "30d" | "90d" | "all";
type TransactionFilter = "all" | "credit" | "debit";

// Unified ledger entry type
interface LedgerEntry {
  id: string;
  date: string;
  type: "credit" | "debit";
  description: string;
  reference?: string;
  amount: number;
  balance?: number;
  currency: string;
  metadata?: Record<string, unknown>;
  user_email?: string;
}

export function SalesTransactions() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: transactionsData, isLoading: transactionsLoading } = useGetWalletTransactionsQuery();

  const isLoading = transactionsLoading;

  // Convert transactions to unified ledger entries
  const ledgerEntries = useMemo((): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    const seenIds = new Set<string>();

    // Add wallet transactions
    if (transactionsData?.data) {
      transactionsData.data.forEach((tx: WalletTransaction) => {
        const entryId = `tx-${tx.id}`;
        // Skip duplicates
        if (seenIds.has(entryId)) {
          return;
        }
        seenIds.add(entryId);

        const isCredit = tx.amount > 0 || tx.transaction_type === "ticket_sale" || tx.transaction_type === "credit";
        entries.push({
          id: entryId,
          date: tx.created_at,
          type: isCredit ? "credit" : "debit",
          description: tx.description || getTransactionLabel(tx.transaction_type),
          reference: tx.reference_id || undefined,
          amount: Math.abs(tx.amount),
          balance: tx.balance_after,
          currency: tx.currency || "INR",
          metadata: tx.metadata,
          user_email: tx.user_email,
        });
      });
    }

    // Sort by date (newest first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionsData]);

  // Filter by time range
  const filteredByTime = useMemo(() => {
    if (timeRange === "all") return ledgerEntries;

    const now = new Date();
    const daysMap: Record<TimeRange, number> = { "7d": 7, "30d": 30, "90d": 90, "all": 0 };
    const startDate = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);

    return ledgerEntries.filter((entry) => new Date(entry.date) >= startDate);
  }, [ledgerEntries, timeRange]);

  // Filter by type and search
  const filteredEntries = useMemo(() => {
    let entries = filteredByTime;

    // Filter by type
    if (filter !== "all") {
      entries = entries.filter((entry) => entry.type === filter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.user_email?.toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query)
      );
    }

    return entries;
  }, [filteredByTime, filter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary stats
  const stats = useMemo(() => {
    const credits = filteredByTime.filter((e) => e.type === "credit");
    const debits = filteredByTime.filter((e) => e.type === "debit");

    return {
      totalCredits: credits.reduce((sum, e) => sum + e.amount, 0),
      totalDebits: debits.reduce((sum, e) => sum + e.amount, 0),
      creditCount: credits.length,
      debitCount: debits.length,
    };
  }, [filteredByTime]);

  const formatCurrency = (amount: number, currency: string = "INR") => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    // Remove "US" prefix from dollar displays
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

  // CSV Export functionality
  const exportToCSV = () => {
    try {
      // Use filtered entries for export
      const entriesToExport = filteredEntries;

      // Convert to CSV
      const headers = [
        "Date",
        "Time",
        "User Email",
        "Type",
        "Description",
        "Amount",
        "Balance",
        "Currency",
        "Reference",
      ];

      const csvRows = [
        headers.join(","),
        ...entriesToExport.map((entry) => {
          const row = [
            formatDate(entry.date),
            formatTime(entry.date),
            entry.user_email ? `"${entry.user_email.replace(/"/g, '""')}"` : "",
            entry.type === "credit" ? "Credit" : "Debit",
            `"${entry.description.replace(/"/g, '""')}"`,
            entry.amount.toString(),
            entry.balance !== undefined ? entry.balance.toString() : "",
            entry.currency || "INR",
            entry.reference ? `"${entry.reference.replace(/"/g, '""')}"` : "",
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
      const filename = `sales-transactions-${dateStr}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export transactions data. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">


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
                  { value: "credit", label: "Credits" },
                  { value: "debit", label: "Debits" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filter === option.value
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
                placeholder="Search by email..."
                className="pl-10 h-9 bg-secondary border-border text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Ticket Ledger
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {filteredEntries.length} entries
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="h-8 gap-2"
                disabled={isLoading || filteredEntries.length === 0}
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
            <div className="col-span-3">Date</div>
            <div className="col-span-4">User Email</div>
            <div className="col-span-2 text-right">Transaction</div>
            <div className="col-span-3 text-right">Balance</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {paginatedEntries.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No transactions found</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try adjusting your filters or time range
                </p>
              </div>
            ) : (
              paginatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors items-center"
                >
                  {/* Date */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      entry.type === "credit"
                        ? "bg-emerald-500/10"
                        : "bg-rose-500/10"
                    }`}>
                      {entry.type === "credit" ? (
                        <ArrowUpRight className={`h-4 w-4 text-emerald-500`} />
                      ) : (
                        <ArrowDownLeft className={`h-4 w-4 text-rose-500`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        {formatDate(entry.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(entry.date)}
                      </p>
                    </div>
                  </div>

                  {/* User Email */}
                  <div className="col-span-4">
                    <p className="text-sm text-foreground truncate">
                      {entry.user_email || "—"}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-semibold ${
                      entry.type === "credit"
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}>
                      {entry.type === "credit" ? "+" : "-"}
                      {entry.amount}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="col-span-3 text-right">
                    <p className="text-sm text-muted-foreground">
                      {entry.balance !== undefined
                        ? entry.balance
                        : "—"}
                    </p>
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
                {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of{" "}
                {filteredEntries.length} entries
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

// Helper function to get readable transaction labels
function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    ticket_sale: "Ticket Sale Revenue",
    credit: "Credit",
    debit: "Debit",
    ticket_purchase: "Ticket Purchase",
    subscription_payment: "Subscription Payment",
    refund: "Refund",
    adjustment: "Balance Adjustment",
    payout: "Payout",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

