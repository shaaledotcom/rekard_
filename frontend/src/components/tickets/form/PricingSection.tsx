"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  IndianRupee, 
  DollarSign, 
  Plus, 
  Minus,
  ChevronDown 
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

  const handlePriceChange = (index: number, value: number) => {
    const newPricing = [...pricing];
    newPricing[index] = { ...newPricing[index], price: value };
    onChange({ pricing: newPricing });
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
                value={item.price ?? ""}
                onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
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
      <p className="text-xs text-muted-foreground">
        Tip: Adding multiple currencies helps international viewers purchase tickets in their preferred currency.
      </p>
    </div>
  );
}

