"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetMyOrdersQuery, useCancelSubscriptionMutation } from "@/store/api";
import { Calendar, Package, Loader2, XCircle } from "lucide-react";
import { formatDateLocal } from "@/lib/datetime";

export function MyOrders() {
  const { data, isLoading, error, refetch } = useGetMyOrdersQuery();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  const orders = data?.data ?? [];

  const handleCancel = async (immediate = false) => {
    try {
      await cancelSubscription({ immediate }).unwrap();
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Badge variant="destructive" className="text-sm">
          Failed to load orders. Please try again.
        </Badge>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            You have no plan subscriptions yet. Subscribe to a plan from the Plans tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeOrder = orders.find((o) => o.status === "active");

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            My orders
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your plan subscriptions and expiry dates. You can cancel an active subscription at any time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left font-medium px-4 py-3">Plan</th>
                    <th className="text-left font-medium px-4 py-3">Start</th>
                    <th className="text-left font-medium px-4 py-3">Expires</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isActive = order.status === "active";
                    const canCancel = isActive && !order.cancel_at_period_end;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {order.plan?.name ?? `Plan #${order.plan_id}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateLocal(String(order.current_period_start))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateLocal(String(order.current_period_end))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {!isActive ? (
                            <Badge variant="secondary" className="font-normal">
                              Inactive
                            </Badge>
                          ) : order.cancel_at_period_end ? (
                            <Badge variant="secondary" className="font-normal">
                              Cancels at period end
                            </Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canCancel ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isCancelling}
                              onClick={() => handleCancel(false)}
                            >
                              {isCancelling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {activeOrder?.cancel_at_period_end && (
            <p className="text-xs text-muted-foreground mt-3">
              Your subscription will end on{" "}
              {formatDateLocal(String(activeOrder.current_period_end))}. You can subscribe again from the Plans tab.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
