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
  TriangleAlert,
  X,
  Search,
  Plus,
  Navigation,
  Hash,
  Map,
} from "lucide-react";
import type { TicketFormData } from "./types";
import { STATUS_OPTIONS } from "./types";
import type { GeoblockingLocation } from "@/store/api";

interface SettingsSectionProps {
  formData: TicketFormData;
  onChange: (data: Partial<TicketFormData>) => void;
  isReadOnly?: boolean;
}

type RuleTab = "country" | "city" | "state" | "pincode" | "coordinates";

// Common countries for events
const COUNTRY_OPTIONS = [
  { code: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "SG", name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "AE", name: "United Arab Emirates", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "NL", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "BR", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "MX", name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "IT", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "SE", name: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "KR", name: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "NZ", name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "ZA", name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "ID", name: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
];

const RULE_TAB_CONFIG: { key: RuleTab; label: string; icon: React.ReactNode }[] = [
  { key: "country", label: "Country", icon: <Globe2 className="h-3.5 w-3.5" /> },
  { key: "state", label: "State", icon: <Map className="h-3.5 w-3.5" /> },
  { key: "city", label: "City", icon: <MapPin className="h-3.5 w-3.5" /> },
  { key: "pincode", label: "Pincode", icon: <Hash className="h-3.5 w-3.5" /> },
  { key: "coordinates", label: "Coordinates", icon: <Navigation className="h-3.5 w-3.5" /> },
];

function getRuleDisplayLabel(rule: GeoblockingLocation): string {
  if (rule.type === "coordinates" && Array.isArray(rule.value)) {
    return rule.name || `(${rule.value[0]}, ${rule.value[1]}) r=${rule.radius_km}km`;
  }
  return rule.name || String(rule.value);
}

function getRuleTypeIcon(type: string): string {
  switch (type) {
    case "country": return "\u{1F30D}";
    case "state": return "\u{1F5FA}\u{FE0F}";
    case "city": return "\u{1F3D9}\u{FE0F}";
    case "pincode": return "\u{1F4EC}";
    case "coordinates": return "\u{1F4CD}";
    default: return "\u{1F30D}";
  }
}

export function SettingsSection({
  formData,
  onChange,
  isReadOnly = false,
}: SettingsSectionProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState<RuleTab>("country");
  const { canPublish } = usePlan();

  // State for non-country rule inputs
  const [ruleCountryCode, setRuleCountryCode] = useState("IN");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [coordLat, setCoordLat] = useState("");
  const [coordLng, setCoordLng] = useState("");
  const [coordRadius, setCoordRadius] = useState("50");

  const geoblockingRules = formData.geoblocking_countries || [];
  
  // Check if we should show publishing warning
  const isAttemptingPublish = formData.status === "published" || formData.status === "sold_out";
  const showPublishingWarning = !canPublish && isAttemptingPublish;

  // Filter countries based on search and already selected
  const filteredCountries = COUNTRY_OPTIONS.filter((country) => {
    const isAlreadySelected = geoblockingRules.some(
      (loc) => loc.type === "country" && loc.value === country.code
    );
    const matchesSearch = 
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  const handleAddCountry = (country: typeof COUNTRY_OPTIONS[0]) => {
    const newRule: GeoblockingLocation = {
      type: "country",
      value: country.code,
      name: country.name,
    };
    onChange({ 
      geoblocking_countries: [...geoblockingRules, newRule] 
    });
    setCountrySearch("");
    setIsDropdownOpen(false);
  };

  const handleAddRule = () => {
    if (activeRuleTab === "country") return; // Countries use the dropdown

    if (activeRuleTab === "coordinates") {
      const lat = parseFloat(coordLat);
      const lng = parseFloat(coordLng);
      const radius = parseFloat(coordRadius);
      if (isNaN(lat) || isNaN(lng) || isNaN(radius) || radius <= 0) return;

      const newRule: GeoblockingLocation = {
        type: "coordinates",
        value: [lat, lng],
        radius_km: radius,
        name: ruleName || `(${lat.toFixed(4)}, ${lng.toFixed(4)}) r=${radius}km`,
      };
      onChange({ geoblocking_countries: [...geoblockingRules, newRule] });
      setCoordLat("");
      setCoordLng("");
      setCoordRadius("50");
      setRuleName("");
      return;
    }

    // city / state / pincode
    if (!ruleValue.trim()) return;

    const newRule: GeoblockingLocation = {
      type: activeRuleTab,
      value: ruleValue.trim(),
      country_code: (activeRuleTab === "city" || activeRuleTab === "state") ? ruleCountryCode : undefined,
      name: ruleName || ruleValue.trim(),
    };
    onChange({ geoblocking_countries: [...geoblockingRules, newRule] });
    setRuleValue("");
    setRuleName("");
  };

  const handleRemoveRule = (index: number) => {
    onChange({
      geoblocking_countries: geoblockingRules.filter((_, i) => i !== index),
    });
  };

  const getCountryInfo = (code: string) => {
    return COUNTRY_OPTIONS.find((c) => c.code === code);
  };

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
        <p className="text-xl text-muted-foreground">
          Only published tickets are visible and available for purchase
          {!canPublish && (
            <span className="block mt-1 text-destructive/80">
              You need an active plan and tickets in your wallet to publish tickets. You can save as draft and publish later.
            </span>
          )}
        </p>
      </div>

      {/* Geoblocking Section */}
      <div className="space-y-4">
        <label className={`flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border ${
          !isReadOnly ? "cursor-pointer hover:border-foreground/30" : ""
        }`}>
          <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
            formData.geoblocking_enabled ? "bg-foreground" : "bg-muted"
          }`}>
            <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
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
              Block ticket purchases and viewing from specific locations
            </p>
          </div>
        </label>

        {formData.geoblocking_enabled && (
          <div className="space-y-4 p-4 rounded-xl bg-secondary border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Blocked Locations
              </Label>
              <Badge variant="secondary" className="text-xs">
                {geoblockingRules.length} rule{geoblockingRules.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Warning when no rules are added */}
            {geoblockingRules.length === 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-destructive/90 text-sm font-medium ">
                  <TriangleAlert /> Please add at least one location
                </p>
                <p className="text-destructive/90 text-xs mt-1">
                  Geo-blocking is enabled but no locations are blocked. Add at least one location or disable it.
                </p>
              </div>
            )}

            {/* Rule Type Tabs */}
            {!isReadOnly && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {RULE_TAB_CONFIG.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveRuleTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeRuleTab === tab.key
                          ? "bg-foreground text-background"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Country tab - searchable dropdown */}
                {activeRuleTab === "country" && (
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
                        placeholder="Search countries to block..."
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

                {/* State / City tab */}
                {(activeRuleTab === "state" || activeRuleTab === "city") && (
                  <div className="flex gap-2">
                    <select
                      value={ruleCountryCode}
                      onChange={(e) => setRuleCountryCode(e.target.value)}
                      className="h-10 px-3 bg-background border border-border text-foreground rounded-lg text-sm w-24"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                    <Input
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      placeholder={activeRuleTab === "state" ? "e.g. Karnataka" : "e.g. Bangalore"}
                      className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRule}
                      disabled={!ruleValue.trim()}
                      className="h-10 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Pincode tab */}
                {activeRuleTab === "pincode" && (
                  <div className="flex gap-2">
                    <Input
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      placeholder="e.g. 560001"
                      className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRule}
                      disabled={!ruleValue.trim()}
                      className="h-10 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Coordinates tab */}
                {activeRuleTab === "coordinates" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={coordLat}
                        onChange={(e) => setCoordLat(e.target.value)}
                        placeholder="Latitude"
                        type="number"
                        step="any"
                        className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                      <Input
                        value={coordLng}
                        onChange={(e) => setCoordLng(e.target.value)}
                        placeholder="Longitude"
                        type="number"
                        step="any"
                        className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={coordRadius}
                        onChange={(e) => setCoordRadius(e.target.value)}
                        placeholder="Radius (km)"
                        type="number"
                        min="1"
                        className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                      <Input
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder="Label (optional)"
                        className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddRule}
                        disabled={!coordLat || !coordLng || !coordRadius}
                        className="h-10 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick add for countries */}
                {activeRuleTab === "country" && geoblockingRules.filter(r => r.type === "country").length < 10 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground text-xs mb-2">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRY_OPTIONS.slice(0, 5)
                        .filter((c) => !geoblockingRules.some((loc) => loc.type === "country" && loc.value === c.code))
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
              </div>
            )}

            {/* Current rules list */}
            <div className="space-y-2">
              {geoblockingRules.length === 0 && !isReadOnly ? (
                <div className="text-center py-4">
                  <Globe2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No locations blocked yet</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Use the tabs above to add locations
                  </p>
                </div>
              ) : geoblockingRules.length > 0 ? (
                geoblockingRules.map((rule, index) => {
                  const countryInfo = rule.type === "country" ? getCountryInfo(rule.value as string) : null;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{countryInfo?.flag || getRuleTypeIcon(rule.type)}</span>
                        <div>
                          <span className="text-foreground text-sm font-medium">
                            {countryInfo?.name || getRuleDisplayLabel(rule)}
                          </span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {rule.type}{rule.country_code ? ` (${rule.country_code})` : ""}
                          </span>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRule(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : null}
            </div>

            {geoblockingRules.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Viewers from blocked locations will not be able to purchase or watch this ticket
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
