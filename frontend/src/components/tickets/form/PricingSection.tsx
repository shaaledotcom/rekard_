"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  IndianRupee, 
  DollarSign, 
  Plus, 
  Minus,
  ChevronDown,
  Heart,
  Check
} from "lucide-react";
import type { TicketFormData, PricingFormData, CurrencyOption } from "./types";
import { CURRENCY_OPTIONS } from "./types";

interface PricingSectionProps {
  formData: TicketFormData;
  onChange: (data: Partial<TicketFormData>) => void;
  isReadOnly?: boolean;
}

export function PricingSection({
  formData,
  onChange,
  isReadOnly = false,
}: PricingSectionProps) {
  const pricing = formData.pricing || [{ currency: "INR", price: 0 }];

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "INR":
        return <IndianRupee className="h-4 w-4" />;
      case "USD":
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCurrencyLabel = (currencyCode: string) => {
    const option = CURRENCY_OPTIONS.find((c) => c.value === currencyCode);
    return option ? option.label : currencyCode;
  };

  const handlePriceChange = (index: number, value: string) => {
    const newPricing = [...pricing];
    // Parse the value - if empty string, keep as 0 but allow input to show empty
    // If valid number, use it; if invalid (NaN), keep current value
    const numValue = value === "" 
      ? 0 
      : (isNaN(parseFloat(value)) ? newPricing[index].price : parseFloat(value));
    newPricing[index] = { ...newPricing[index], price: numValue };
    onChange({ pricing: newPricing });
  };

  const handlePriceBlur = (index: number, value: string) => {
    // On blur, ensure empty string becomes 0
    if (value === "" || isNaN(parseFloat(value))) {
      const newPricing = [...pricing];
      newPricing[index] = { ...newPricing[index], price: 0 };
      onChange({ pricing: newPricing });
    }
  };

  const handleCurrencyChange = (index: number, currency: string) => {
    const newPricing = [...pricing];
    newPricing[index] = { ...newPricing[index], currency };
    onChange({ pricing: newPricing });
  };

  const handleAddCurrency = () => {
    // Find a currency not yet added
    const usedCurrencies = pricing.map((p) => p.currency);
    const availableCurrency = CURRENCY_OPTIONS.find((c) => !usedCurrencies.includes(c.value));
    
    if (availableCurrency) {
      onChange({ 
        pricing: [...pricing, { currency: availableCurrency.value, price: 0 }] 
      });
    }
  };

  const handleRemoveCurrency = (index: number) => {
    if (pricing.length <= 1) {
      // Reset instead of removing last one
      onChange({ pricing: [{ currency: "INR", price: 0 }] });
    } else {
      onChange({ pricing: pricing.filter((_, i) => i !== index) });
    }
  };

  const canAddMore = pricing.length < CURRENCY_OPTIONS.length;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <Label className="text-foreground/70 text-sm font-medium">Pricing *</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Set the price for your ticket in different currencies
        </p>
      </div>

      {/* Fundraiser Toggle */}
      <button
        type="button"
        onClick={() => !isReadOnly && onChange({ is_fundraiser: !formData.is_fundraiser })}
        disabled={isReadOnly}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${
          formData.is_fundraiser ? "bg-secondary" : "hover:bg-secondary"
        } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          formData.is_fundraiser
            ? "bg-foreground border-foreground"
            : "border-muted-foreground"
        }`}>
          {formData.is_fundraiser && <Check className="h-3 w-3 text-background" />}
        </div>
        <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground/80">Fundraiser : Buyers can pay above base price</span>
      </button>

      {/* Pricing Rows */}
      <div className="space-y-3">
        {pricing.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Currency Selector */}
            <div className="relative w-48">
              <select
                value={item.currency}
                onChange={(e) => handleCurrencyChange(index, e.target.value)}
                disabled={isReadOnly}
                className="w-full h-12 pl-10 pr-10 bg-secondary border border-border text-foreground rounded-xl appearance-none cursor-pointer focus:border-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option 
                    key={currency.value} 
                    value={currency.value}
                    className="bg-background text-foreground"
                  >
                    {currency.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencyIcon(item.currency)}
              </div>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Price Input */}
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.price === 0 ? "" : item.price ?? ""}
                onChange={(e) => handlePriceChange(index, e.target.value)}
                onBlur={(e) => handlePriceBlur(index, e.target.value)}
                placeholder="0.00"
                disabled={isReadOnly}
                className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-foreground/50"
              />
            </div>

            {/* Remove Button */}
            {!isReadOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCurrency(index)}
                disabled={pricing.length <= 1 && item.price === 0}
                className="h-12 w-12 text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Currency Button */}
      {!isReadOnly && canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCurrency}
          className="w-full bg-secondary border-border border-dashed text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Currency
        </Button>
      )}

      {/* Info */}
      {formData.is_fundraiser ? (
        <p className="text-xs text-muted-foreground">
          This price will be the minimum amount buyers can pay. Buyers can choose to pay more to support your cause.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tip: Adding multiple currencies helps international viewers purchase tickets in their preferred currency.
        </p>
      )}
    </div>
  );
}

