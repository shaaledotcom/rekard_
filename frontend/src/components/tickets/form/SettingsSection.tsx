"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PublishingRestrictionAlert } from "@/components/ui/upgrade-button";
import { usePlan } from "@/hooks/usePlan";
import { 
  Globe2, 
  Settings2,
  ChevronDown,
  MapPin,
  X,
  Search,
  Plus,
  AlertTriangle
} from "lucide-react";
import type { TicketFormData } from "./types";
import { STATUS_OPTIONS } from "./types";
import type { GeoblockingLocation } from "@/store/api";

interface SettingsSectionProps {
  formData: TicketFormData;
  onChange: (data: Partial<TicketFormData>) => void;
  isReadOnly?: boolean;
}

// Common countries for music events
const COUNTRY_OPTIONS = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
];

export function SettingsSection({
  formData,
  onChange,
  isReadOnly = false,
}: SettingsSectionProps) {
  // const [countrySearch, setCountrySearch] = useState("");
  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { canPublish, hasActivePlan, hasTickets } = usePlan();

  // const geoblockingCountries = formData.geoblocking_countries || [];
  
  // Check if we should show publishing warning (when trying to set status to published but can't)
  const isAttemptingPublish = formData.status === "published" || formData.status === "sold_out";
  const showPublishingWarning = !canPublish && isAttemptingPublish;

  // Filter countries based on search and already selected
  // const filteredCountries = COUNTRY_OPTIONS.filter((country) => {
  //   const isAlreadySelected = geoblockingCountries.some(
  //     (loc) => loc.value === country.code
  //   );
  //   const matchesSearch = 
  //     country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
  //     country.code.toLowerCase().includes(countrySearch.toLowerCase());
  //   return !isAlreadySelected && matchesSearch;
  // });

  // const handleAddCountry = (country: typeof COUNTRY_OPTIONS[0]) => {
  //   const newLocation: GeoblockingLocation = {
  //     type: "country",
  //     value: country.code,
  //     name: country.name,
  //   };
  //   onChange({ 
  //     geoblocking_countries: [...geoblockingCountries, newLocation] 
  //   });
  //   setCountrySearch("");
  //   setIsDropdownOpen(false);
  // };

  // const handleRemoveCountry = (index: number) => {
  //   onChange({
  //     geoblocking_countries: geoblockingCountries.filter((_, i) => i !== index),
  //   });
  // };

  // const getCountryInfo = (code: string) => {
  //   return COUNTRY_OPTIONS.find((c) => c.code === code);
  // };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
          <Settings2 className="h-5 w-5" />
          Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          Set status and availability options
        </p>
      </div>

      {/* Publishing Restriction Alert */}
      {showPublishingWarning && (
        <PublishingRestrictionAlert />
      )}

      {/* Status Selection */}
      <div className={`space-y-3 p-4 rounded-xl bg-secondary border ${showPublishingWarning ? "border-destructive/30" : "border-border"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              formData.status === "published" ? "bg-foreground" :
              formData.status === "draft" ? "bg-muted-foreground" :
              formData.status === "sold_out" ? "bg-foreground/50" :
              "bg-muted-foreground"
            }`} />
            <Label className="text-foreground/70 text-sm font-medium">Status</Label>
          </div>
          <Badge variant={formData.status as any}>
            {STATUS_OPTIONS.find((s) => s.value === formData.status)?.label || "Draft"}
          </Badge>
        </div>
        <div className="relative">
          <select
            value={formData.status}
            onChange={(e) => {
              const newStatus = e.target.value as any;
              // If trying to publish without plan, automatically set to draft
              if ((newStatus === "published" || newStatus === "sold_out") && !canPublish) {
                onChange({ status: "draft" });
              } else {
                onChange({ status: newStatus });
              }
            }}
            disabled={isReadOnly}
            className="w-full h-12 px-4 pr-10 bg-secondary border border-border text-foreground rounded-xl appearance-none cursor-pointer focus:border-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
          >
            {STATUS_OPTIONS.map((status) => {
              // Disable published/sold_out options if user doesn't have plan
              const isPublishingStatus = status.value === "published" || status.value === "sold_out";
              const isDisabled = !isReadOnly && isPublishingStatus && !canPublish;
              
              return (
                <option 
                  key={status.value} 
                  value={status.value}
                  disabled={isDisabled}
                  className="bg-background text-foreground"
                >
                  {status.label} {isDisabled ? "(Plan Required)" : ""}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <p className="text-xs text-muted-foreground">
          Only published tickets are visible and available for purchase
          {!canPublish && (
            <span className="block mt-1 text-destructive/80">
              You need an active plan and tickets in your wallet to publish tickets. You can save as draft and publish later.
            </span>
          )}
        </p>
      </div>

      {/* Geoblocking Section - Commented out */}
      {/*
      <div className="space-y-4">
        <label className={`flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border ${
          !isReadOnly ? "cursor-pointer hover:border-foreground/30" : ""
        }`}>
          <div className={`w-12 h-7 rounded-full p-1 ${
            formData.geoblocking_enabled ? "bg-foreground" : "bg-muted"
          }`}>
            <div className={`w-5 h-5 rounded-full bg-background shadow ${
              formData.geoblocking_enabled ? "translate-x-5" : "translate-x-0"
            }`} />
          </div>
          <input
            type="checkbox"
            checked={formData.geoblocking_enabled}
            onChange={(e) => onChange({ geoblocking_enabled: e.target.checked })}
            disabled={isReadOnly}
            className="sr-only"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-foreground" />
              <p className="text-foreground font-medium text-sm">Enable Geo-blocking</p>
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              Restrict ticket purchases to specific countries only
            </p>
          </div>
        </label>

        {formData.geoblocking_enabled && (
          <div className="space-y-4 p-4 rounded-xl bg-secondary border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Allowed Countries
              </Label>
              <Badge variant="secondary" className="text-xs">
                {geoblockingCountries.length} selected
              </Badge>
            </div>

            {!isReadOnly && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search countries to allow..."
                    className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                  />
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.slice(0, 8).map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleAddCountry(country)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary"
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-foreground text-sm">{country.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">{country.code}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-muted-foreground text-sm text-center">
                        {countrySearch ? "No countries found" : "Type to search"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {geoblockingCountries.length === 0 ? (
                <div className="text-center py-4">
                  <Globe2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No countries selected</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Add countries where viewers can purchase this ticket
                  </p>
                </div>
              ) : (
                geoblockingCountries.map((location, index) => {
                  const countryInfo = getCountryInfo(location.value as string);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{countryInfo?.flag || "🌍"}</span>
                        <div>
                          <span className="text-foreground text-sm font-medium">
                            {location.name || countryInfo?.name || location.value}
                          </span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {location.value}
                          </span>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCountry(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {!isReadOnly && geoblockingCountries.length < 5 && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-xs mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS.slice(0, 5)
                    .filter((c) => !geoblockingCountries.some((loc) => loc.value === c.code))
                    .map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleAddCountry(country)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background hover:bg-muted text-foreground/70 hover:text-foreground text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Only viewers from selected countries will be able to purchase this ticket
            </p>
          </div>
        )}
      </div>
      */}
    </div>
  );
}
