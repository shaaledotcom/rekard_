"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Tag, 
  Plus, 
  Pencil, 
  Trash2, 
  Percent,
  Calendar,
  Hash,
  AlertCircle
} from "lucide-react";
import type { TicketFormData, CouponFormData } from "./types";
import { localToUTC, utcToLocalInput, formatDateTimeLocal } from "@/lib/datetime";

interface CouponSectionProps {
  formData: TicketFormData;
  onChange: (data: Partial<TicketFormData>) => void;
  isReadOnly?: boolean;
}

const DEFAULT_COUPON: CouponFormData = {
  title: "",
  code: "",
  count: 100,
  activation_time: "",
  expiry_time: "",
  discount: "",
};

export function CouponSection({
  formData,
  onChange,
  isReadOnly = false,
}: CouponSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [couponForm, setCouponForm] = useState<CouponFormData>(DEFAULT_COUPON);

  const coupons = formData.coupons || [];

  const handleAdd = () => {
    setCouponForm(DEFAULT_COUPON);
    setEditIndex(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    const coupon = coupons[index];
    // Convert UTC times to local for editing
    setCouponForm({
      ...coupon,
      activation_time: coupon.activation_time ? utcToLocalInput(coupon.activation_time) : "",
      expiry_time: coupon.expiry_time ? utcToLocalInput(coupon.expiry_time) : "",
    });
    setEditIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    onChange({ coupons: coupons.filter((_, i) => i !== index) });
  };

  const handleSubmit = () => {
    if (!couponForm.title || !couponForm.code || !couponForm.discount) {
      return;
    }

    // Convert local times to UTC before saving
    const couponToSave: CouponFormData = {
      ...couponForm,
      activation_time: couponForm.activation_time ? localToUTC(couponForm.activation_time) : "",
      expiry_time: couponForm.expiry_time ? localToUTC(couponForm.expiry_time) : "",
    };

    if (editIndex !== null) {
      const newCoupons = [...coupons];
      newCoupons[editIndex] = couponToSave;
      onChange({ coupons: newCoupons });
    } else {
      onChange({ coupons: [...coupons, couponToSave] });
    }

    setDialogOpen(false);
    setCouponForm(DEFAULT_COUPON);
    setEditIndex(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      return formatDateTimeLocal(dateStr, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Coupon Codes
          </Label>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Create discount codes for your viewers
          </p>
        </div>
        {!isReadOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="bg-secondary/50 border-border text-foreground hover:bg-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
        )}
      </div>

      {/* Coupons List */}
      <div className="border-2 border-dashed border-border rounded-xl overflow-hidden">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No coupon codes added yet</p>
            {!isReadOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAdd}
                className="mt-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first coupon
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {coupons.map((coupon, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-foreground">{coupon.title}</span>
                    <Badge variant="secondary" className="font-mono">
                      {coupon.code}
                    </Badge>
                    <Badge variant="default" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      {coupon.discount}% off
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {coupon.count} uses
                    </span>
                    {coupon.activation_time && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        From: {formatDate(coupon.activation_time) || "N/A"}
                      </span>
                    )}
                    {coupon.expiry_time && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Until: {formatDate(coupon.expiry_time) || "N/A"}
                      </span>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coupon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              {editIndex !== null ? "Edit Coupon" : "Add Coupon"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a discount code for your viewers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Title *</Label>
                <Input
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                  placeholder="Early Bird Discount"
                  className="h-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Code *</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="EARLY20"
                  className="h-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Usage Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={couponForm.count || ""}
                  onChange={(e) => setCouponForm({ ...couponForm, count: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                  className="h-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Discount % *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={couponForm.discount || ""}
                    onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                    placeholder="20"
                    className="h-10 pr-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Activation Time</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.activation_time}
                  onChange={(e) => setCouponForm({ ...couponForm, activation_time: e.target.value })}
                  className="h-10 bg-secondary/50 border-border text-foreground rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Expiry Time</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.expiry_time}
                  onChange={(e) => setCouponForm({ ...couponForm, expiry_time: e.target.value })}
                  className="h-10 bg-secondary/50 border-border text-foreground rounded-lg"
                />
              </div>
            </div>

            {(!couponForm.title || !couponForm.code || !couponForm.discount) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Please fill in all required fields (title, code, discount)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!couponForm.title || !couponForm.code || !couponForm.discount}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {editIndex !== null ? "Update" : "Add"} Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

