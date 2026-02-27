"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { SalesTransactions } from "@/components/billing/SalesTransactions";
import { SalesReport } from "@/components/billing/SalesReport";

function DashboardContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main content */}
      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <div className="space-y-8">
          {/* Tabs for Sales Report and Transactions */}
          <Tabs defaultValue="sales-report" className="w-full">
            <TabsList className="bg-secondary border-border">
              <TabsTrigger value="sales-report">Sales</TabsTrigger>
              <TabsTrigger value="transactions">Ticket Ledger</TabsTrigger>
            </TabsList>
            <TabsContent value="sales-report" className="mt-6">
              <SalesReport />
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <SalesTransactions />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
