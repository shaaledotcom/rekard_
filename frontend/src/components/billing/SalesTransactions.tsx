"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetWalletTransactionsQuery,
  useGetInvoicesQuery,
  type WalletTransaction,
  type Invoice,
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

type TimeRange = "7d" | "30d" | "90d" | "all";
type TransactionFilter = "all" | "credit" | "debit" | "invoice";

// Unified ledger entry type
interface LedgerEntry {
  id: string;
  date: string;
  type: "credit" | "debit" | "invoice";
  description: string;
  reference?: string;
  amount: number;
  balance?: number;
  status?: string;
  currency: string;
  metadata?: Record<string, unknown>;
}

export function SalesTransactions() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: transactionsData, isLoading: transactionsLoading } = useGetWalletTransactionsQuery();
  const { data: invoicesData, isLoading: invoicesLoading } = useGetInvoicesQuery();

  const isLoading = transactionsLoading || invoicesLoading;

  // Convert transactions and invoices to unified ledger entries
  const ledgerEntries = useMemo((): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];

    // Add wallet transactions
    if (transactionsData?.data) {
      transactionsData.data.forEach((tx: WalletTransaction) => {
        const isCredit = tx.amount > 0 || tx.transaction_type === "ticket_sale" || tx.transaction_type === "credit";
        entries.push({
          id: `tx-${tx.id}`,
          date: tx.created_at,
          type: isCredit ? "credit" : "debit",
          description: tx.description || getTransactionLabel(tx.transaction_type),
          reference: tx.reference_id || undefined,
          amount: Math.abs(tx.amount),
          balance: tx.balance_after,
          currency: tx.currency || "INR",
          metadata: tx.metadata,
        });
      });
    }

    // Add invoices
    if (invoicesData?.data) {
      invoicesData.data.forEach((invoice: Invoice) => {
        entries.push({
          id: `inv-${invoice.id}`,
          date: invoice.created_at,
          type: "invoice",
          description: `Invoice ${invoice.invoice_number}`,
          reference: invoice.invoice_number,
          amount: invoice.total_amount,
          status: invoice.status,
          currency: invoice.currency || "INR",
          metadata: { items: invoice.items, notes: invoice.notes },
        });
      });
    }

    // Sort by date (newest first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionsData, invoicesData]);

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
          entry.description.toLowerCase().includes(query) ||
          entry.reference?.toLowerCase().includes(query)
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
    const invoices = filteredByTime.filter((e) => e.type === "invoice");
    const paidInvoices = invoices.filter((e) => e.status === "paid");

    return {
      totalCredits: credits.reduce((sum, e) => sum + e.amount, 0),
      totalDebits: debits.reduce((sum, e) => sum + e.amount, 0),
      totalInvoiceRevenue: paidInvoices.reduce((sum, e) => sum + e.amount, 0),
      creditCount: credits.length,
      debitCount: debits.length,
      invoiceCount: invoices.length,
    };
  }, [filteredByTime]);

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total Credits
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(stats.totalCredits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.creditCount} transactions
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Total Debits
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(stats.totalDebits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.debitCount} transactions
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10">
                <ArrowDownLeft className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Invoice Revenue
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(stats.totalInvoiceRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.invoiceCount} invoices
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Net Balance
                </p>
                <p className={`text-2xl font-bold mt-1 ${
                  stats.totalCredits - stats.totalDebits >= 0 
                    ? "text-emerald-500" 
                    : "text-rose-500"
                }`}>
                  {formatCurrency(stats.totalCredits - stats.totalDebits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  For selected period
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
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
                  { value: "credit", label: "Credits" },
                  { value: "debit", label: "Debits" },
                  { value: "invoice", label: "Invoices" },
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
                placeholder="Search transactions..."
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
              Transaction Ledger
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {filteredEntries.length} entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-secondary/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Balance</div>
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
                  <div className="col-span-2">
                    <p className="text-sm text-foreground font-medium">
                      {formatDate(entry.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(entry.date)}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      entry.type === "credit"
                        ? "bg-emerald-500/10"
                        : entry.type === "debit"
                        ? "bg-rose-500/10"
                        : "bg-blue-500/10"
                    }`}>
                      {entry.type === "credit" ? (
                        <ArrowUpRight className={`h-4 w-4 text-emerald-500`} />
                      ) : entry.type === "debit" ? (
                        <ArrowDownLeft className={`h-4 w-4 text-rose-500`} />
                      ) : (
                        <FileText className={`h-4 w-4 text-blue-500`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-1.5 py-0 ${
                            entry.type === "credit"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : entry.type === "debit"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {entry.type}
                        </Badge>
                        {entry.status && (
                          <Badge 
                            variant="secondary" 
                            className={`text-[10px] px-1.5 py-0 ${
                              entry.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : entry.status === "pending"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {entry.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {entry.reference || "—"}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-semibold ${
                      entry.type === "credit"
                        ? "text-emerald-500"
                        : entry.type === "debit"
                        ? "text-rose-500"
                        : "text-foreground"
                    }`}>
                      {entry.type === "credit" ? "+" : entry.type === "debit" ? "-" : ""}
                      {formatCurrency(entry.amount, entry.currency)}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="col-span-2 text-right">
                    <p className="text-sm text-muted-foreground">
                      {entry.balance !== undefined
                        ? formatCurrency(entry.balance, entry.currency)
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

