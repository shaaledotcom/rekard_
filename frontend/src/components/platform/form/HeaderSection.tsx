"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Upload,
  Plus,
  Trash2,
  ShoppingCart,
  Image as ImageIcon,
  Tag,
  Info,
} from "lucide-react";
import type { PlatformFormData, CouponCodeFormData } from "./types";

interface HeaderSectionProps {
  formData: PlatformFormData;
  onChange: (data: Partial<PlatformFormData>) => void;
  isReadOnly?: boolean;
}

export function HeaderSection({
  formData,
  onChange,
  isReadOnly = false,
}: HeaderSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo handlers
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange({
        logo_file: file,
        logo_url: URL.createObjectURL(file),
      });
    }
  };

  const handleLogoClick = () => {
    if (!isReadOnly) {
      fileInputRef.current?.click();
    }
  };

  // Coupon handlers
  const handleAddCoupon = () => {
    const newCoupon: CouponCodeFormData = {
      id: Date.now().toString(),
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: undefined,
      max_discount: undefined,
      valid_from: "",
      valid_until: "",
      usage_limit: undefined,
      used_count: 0,
      is_active: true,
    };
    onChange({ coupon_codes: [...formData.coupon_codes, newCoupon] });
  };

  const handleDeleteCoupon = (id: string) => {
    onChange({
      coupon_codes: formData.coupon_codes.filter((c) => c.id !== id),
    });
  };

  const handleCouponChange = (
    id: string,
    field: keyof CouponCodeFormData,
    value: string | number | boolean | undefined
  ) => {
    onChange({
      coupon_codes: formData.coupon_codes.map((coupon) =>
        coupon.id === id ? { ...coupon, [field]: value } : coupon
      ),
    });
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Header Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your platform logo, cart, and coupon settings
        </p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Label className="text-foreground/70 text-sm font-medium">
            Platform Logo
          </Label>
          <Badge variant="secondary" className="text-xs">
            PNG Recommended
          </Badge>
        </div>

        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div
            onClick={handleLogoClick}
            className={`relative w-24 h-24 rounded-xl border-2 border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden ${
              !isReadOnly ? "cursor-pointer hover:border-foreground/50 hover:bg-secondary/80" : ""
            }`}
          >
            {formData.logo_url ? (
              <img
                src={formData.logo_url}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoUpload}
              disabled={isReadOnly}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Upload a square transparent PNG logo for best results. Recommended size: 200x200px
            </p>
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogoClick}
                className="bg-secondary border-border text-foreground hover:bg-muted"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Toggle */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <Label className="text-foreground/70 text-sm font-medium">
            Shopping Cart
          </Label>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Enable Cart</p>
            <p className="text-xs text-muted-foreground">
              Allow users to purchase multiple items at once
            </p>
          </div>
          <button
            type="button"
            onClick={() => !isReadOnly && onChange({ enable_cart: !formData.enable_cart })}
            disabled={isReadOnly}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
              formData.enable_cart ? "bg-primary" : "bg-muted"
            } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
                formData.enable_cart ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Coupon Codes - Only show when cart is enabled */}
      {formData.enable_cart && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Label className="text-foreground/70 text-sm font-medium">
                Coupon Codes
              </Label>
            </div>
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCoupon}
                className="bg-secondary border-border text-foreground hover:bg-muted"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Coupon
              </Button>
            )}
          </div>

          {formData.coupon_codes.length === 0 ? (
            <div className="text-center p-8 rounded-xl bg-secondary/50 border border-dashed border-border">
              <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No coupon codes yet. Add one to offer discounts to your customers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.coupon_codes.map((coupon, index) => (
                <div
                  key={coupon.id}
                  className="p-4 rounded-xl bg-secondary border border-border space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      Coupon #{index + 1}
                    </h4>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Code */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Code *
                      </Label>
                      <Input
                        value={coupon.code}
                        onChange={(e) =>
                          handleCouponChange(coupon.id, "code", e.target.value.toUpperCase())
                        }
                        placeholder="SUMMER2024"
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg uppercase"
                      />
                    </div>

                    {/* Discount Type */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Discount Type
                      </Label>
                      <Select
                        value={coupon.discount_type}
                        onChange={(e) =>
                          handleCouponChange(coupon.id, "discount_type", e.target.value)
                        }
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground rounded-lg"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </Select>
                    </div>

                    {/* Discount Value */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Discount Value *
                      </Label>
                      <Input
                        type="number"
                        value={coupon.discount_value || ""}
                        onChange={(e) =>
                          handleCouponChange(
                            coupon.id,
                            "discount_value",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder={coupon.discount_type === "percentage" ? "10" : "100"}
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                    </div>

                    {/* Min Purchase */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Min Purchase
                      </Label>
                      <Input
                        type="number"
                        value={coupon.min_purchase || ""}
                        onChange={(e) =>
                          handleCouponChange(
                            coupon.id,
                            "min_purchase",
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        placeholder="100"
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                    </div>

                    {/* Max Discount */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Max Discount
                      </Label>
                      <Input
                        type="number"
                        value={coupon.max_discount || ""}
                        onChange={(e) =>
                          handleCouponChange(
                            coupon.id,
                            "max_discount",
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        placeholder="500"
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                    </div>

                    {/* Usage Limit */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Usage Limit
                      </Label>
                      <Input
                        type="number"
                        value={coupon.usage_limit || ""}
                        onChange={(e) =>
                          handleCouponChange(
                            coupon.id,
                            "usage_limit",
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="100"
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                    </div>

                    {/* Valid From */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Valid From
                      </Label>
                      <Input
                        type="datetime-local"
                        value={coupon.valid_from || ""}
                        onChange={(e) =>
                          handleCouponChange(coupon.id, "valid_from", e.target.value)
                        }
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground rounded-lg"
                      />
                    </div>

                    {/* Valid Until */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Valid Until
                      </Label>
                      <Input
                        type="datetime-local"
                        value={coupon.valid_until || ""}
                        onChange={(e) =>
                          handleCouponChange(coupon.id, "valid_until", e.target.value)
                        }
                        disabled={isReadOnly}
                        className="h-10 bg-background border-border text-foreground rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Active Toggle & Used Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            !isReadOnly &&
                            handleCouponChange(coupon.id, "is_active", !coupon.is_active)
                          }
                          disabled={isReadOnly}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                            coupon.is_active ? "bg-primary" : "bg-muted"
                          } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
                              coupon.is_active ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      Used: {coupon.used_count || 0}
                      {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
