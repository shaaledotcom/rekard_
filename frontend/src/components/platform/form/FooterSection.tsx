"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Building2,
  FileText,
  Headphones,
  Share2,
  RotateCcw,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { PlatformFormData, SupportChannelFormData, SocialLinkFormData, FooterPolicies } from "./types";
import { 
  SUPPORT_CHANNEL_TYPES, 
  SOCIAL_PLATFORMS,
  generatePolicyContent,
  generateDefaultPolicies,
  isPolicyEmpty,
  DEFAULT_POLICY_TEMPLATES,
} from "./types";

interface FooterSectionProps {
  formData: PlatformFormData;
  onChange: (data: Partial<PlatformFormData>) => void;
  isReadOnly?: boolean;
}

export function FooterSection({
  formData,
  onChange,
  isReadOnly = false,
}: FooterSectionProps) {
  // Track the original legal name from when policies were populated/saved
  // This is used to find/replace when user wants to update the name in policies
  const [savedLegalName, setSavedLegalName] = useState<string>("");
  const [showFillPrompt, setShowFillPrompt] = useState(false);
  const hasInitializedRef = useRef(false);

  // Check if all policies are empty
  const areAllPoliciesEmpty = useCallback(() => {
    const policies = formData.footer_policies;
    return (
      isPolicyEmpty(policies.about_us?.content) &&
      isPolicyEmpty(policies.terms_of_service?.content) &&
      isPolicyEmpty(policies.privacy_policy?.content) &&
      isPolicyEmpty(policies.refund_policy?.content) &&
      isPolicyEmpty(policies.faqs?.content) &&
      isPolicyEmpty(policies.contact_us?.content)
    );
  }, [formData.footer_policies]);

  // Replace old legal name with new legal name in a policy content
  const replaceLegalNameInContent = (content: string | undefined, oldName: string, newName: string): string => {
    if (!content) return "";
    if (!oldName || !newName || oldName === newName) return content;
    
    // Case-insensitive global replace
    const regex = new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return content.replace(regex, newName);
  };

  // Initialize savedLegalName when policies have content (form loaded with existing data)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    // If there's existing content in policies, save the current legal name as the "saved" name
    if (!areAllPoliciesEmpty() && formData.legal_name) {
      setSavedLegalName(formData.legal_name);
      hasInitializedRef.current = true;
    }
  }, [formData.legal_name, areAllPoliciesEmpty]);

  // Show fill prompt when legal name is entered for the first time with empty policies
  useEffect(() => {
    if (
      formData.legal_name && 
      formData.legal_name.trim() !== "" && 
      areAllPoliciesEmpty() &&
      !savedLegalName
    ) {
      setShowFillPrompt(true);
    }
  }, [formData.legal_name, areAllPoliciesEmpty, savedLegalName]);

  // Check if legal name has changed from saved version
  const hasLegalNameChanged = savedLegalName && 
    formData.legal_name && 
    savedLegalName !== formData.legal_name;

  // Apply the legal name change to all policies (explicit user action)
  const handleApplyNameChange = () => {
    if (!savedLegalName || !formData.legal_name) return;
    
    const oldName = savedLegalName;
    const newName = formData.legal_name;
    const policies = formData.footer_policies;
    const updatedPolicies: FooterPolicies = { ...policies };

    if (policies.about_us) {
      updatedPolicies.about_us = {
        ...policies.about_us,
        content: replaceLegalNameInContent(policies.about_us.content, oldName, newName),
      };
    }
    if (policies.terms_of_service) {
      updatedPolicies.terms_of_service = {
        ...policies.terms_of_service,
        content: replaceLegalNameInContent(policies.terms_of_service.content, oldName, newName),
      };
    }
    if (policies.privacy_policy) {
      updatedPolicies.privacy_policy = {
        ...policies.privacy_policy,
        content: replaceLegalNameInContent(policies.privacy_policy.content, oldName, newName),
      };
    }
    if (policies.refund_policy) {
      updatedPolicies.refund_policy = {
        ...policies.refund_policy,
        content: replaceLegalNameInContent(policies.refund_policy.content, oldName, newName),
      };
    }
    if (policies.faqs) {
      updatedPolicies.faqs = {
        ...policies.faqs,
        content: replaceLegalNameInContent(policies.faqs.content, oldName, newName),
      };
    }
    if (policies.contact_us) {
      updatedPolicies.contact_us = {
        ...policies.contact_us,
        content: replaceLegalNameInContent(policies.contact_us.content, oldName, newName),
      };
    }

    // Update saved name to the new name
    setSavedLegalName(newName);
    onChange({ footer_policies: updatedPolicies });
  };

  // Fill all policies with default templates
  const handleFillAllDefaults = () => {
    const defaultPolicies = generateDefaultPolicies(formData.legal_name);
    onChange({ footer_policies: defaultPolicies });
    // Save the current legal name as the "saved" version
    setSavedLegalName(formData.legal_name);
    setShowFillPrompt(false);
    hasInitializedRef.current = true;
  };

  // Reset a single policy to its default template
  const handleResetPolicy = (policyKey: keyof typeof DEFAULT_POLICY_TEMPLATES) => {
    const titleMap: Record<keyof typeof DEFAULT_POLICY_TEMPLATES, string> = {
      about_us: "About Us",
      terms_of_service: "Terms of Service",
      privacy_policy: "Privacy Policy",
      refund_policy: "Refund Policy",
      faqs: "FAQs",
      contact_us: "Contact Us",
    };

    onChange({
      footer_policies: {
        ...formData.footer_policies,
        [policyKey]: {
          title: titleMap[policyKey],
          content: generatePolicyContent(policyKey, formData.legal_name),
        },
      },
    });
  };

  // Policy handlers
  const handlePolicyChange = (
    field: keyof FooterPolicies,
    key: "title" | "content",
    value: string
  ) => {
    const currentPolicy = formData.footer_policies[field] || { title: "", content: "" };
    onChange({
      footer_policies: {
        ...formData.footer_policies,
        [field]: { ...currentPolicy, [key]: value },
      },
    });
  };

  // Support channel handlers
  const handleAddSupportChannel = () => {
    const newChannel: SupportChannelFormData = {
      id: Date.now().toString(),
      type: "email",
      value: "",
    };
    onChange({ support_channels: [...formData.support_channels, newChannel] });
  };

  const handleDeleteSupportChannel = (id: string) => {
    onChange({
      support_channels: formData.support_channels.filter((c) => c.id !== id),
    });
  };

  const handleSupportChannelChange = (
    id: string,
    field: keyof SupportChannelFormData,
    value: string
  ) => {
    onChange({
      support_channels: formData.support_channels.map((channel) =>
        channel.id === id ? { ...channel, [field]: value } : channel
      ),
    });
  };

  // Social link handlers
  const handleAddSocialLink = () => {
    const newLink: SocialLinkFormData = {
      id: Date.now().toString(),
      platform: "youtube",
      url: "",
    };
    onChange({ social_links: [...formData.social_links, newLink] });
  };

  const handleDeleteSocialLink = (id: string) => {
    onChange({
      social_links: formData.social_links.filter((l) => l.id !== id),
    });
  };

  const handleSocialLinkChange = (
    id: string,
    field: keyof SocialLinkFormData,
    value: string
  ) => {
    onChange({
      social_links: formData.social_links.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      ),
    });
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Footer Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your platform footer content, policies, and social links
        </p>
      </div>

      {/* Legal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-foreground/70 text-sm font-medium">
            Legal Information
          </Label>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Legal Name</Label>
          <Input
            value={formData.legal_name}
            onChange={(e) => onChange({ legal_name: e.target.value })}
            placeholder="Enter your legal business name"
            disabled={isReadOnly}
            className="h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg"
          />
          <p className="text-xs text-muted-foreground">
            This name will appear in all policies and legal documents
          </p>
        </div>

        {/* Apply Name Change Prompt - shown when legal name differs from saved version */}
        {hasLegalNameChanged && !isReadOnly && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Update Name in Policies
                </p>
                <p className="text-xs text-muted-foreground">
                  Replace &quot;{savedLegalName}&quot; with &quot;{formData.legal_name}&quot; in all policies
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyNameChange}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Change
            </Button>
          </div>
        )}
      </div>

      {/* Auto-fill Prompt */}
      {showFillPrompt && !isReadOnly && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Generate Default Policies
              </p>
              <p className="text-xs text-muted-foreground">
                Fill all policy fields with templates using &quot;{formData.legal_name}&quot;
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFillPrompt(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleFillAllDefaults}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate All
            </Button>
          </div>
        </div>
      )}

      {/* Policies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label className="text-foreground/70 text-sm font-medium">
              Policies & Information
            </Label>
          </div>
          {!isReadOnly && formData.legal_name && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillAllDefaults}
              className="bg-secondary border-border text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All to Default
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* About Us */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">About Us</Label>
              {!isReadOnly && formData.legal_name && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPolicy("about_us")}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Use Default
                </Button>
              )}
            </div>
            <Textarea
              value={formData.footer_policies.about_us?.content || ""}
              onChange={(e) => handlePolicyChange("about_us", "content", e.target.value)}
              placeholder="Tell your customers about your business..."
              disabled={isReadOnly}
              rows={4}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg resize-none"
            />
          </div>

          {/* Terms of Service */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Terms of Service</Label>
              {!isReadOnly && formData.legal_name && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPolicy("terms_of_service")}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Use Default
                </Button>
              )}
            </div>
            <Textarea
              value={formData.footer_policies.terms_of_service?.content || ""}
              onChange={(e) => handlePolicyChange("terms_of_service", "content", e.target.value)}
              placeholder="Enter your terms of service..."
              disabled={isReadOnly}
              rows={4}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg resize-none"
            />
          </div>

          {/* Privacy Policy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Privacy Policy</Label>
              {!isReadOnly && formData.legal_name && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPolicy("privacy_policy")}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Use Default
                </Button>
              )}
            </div>
            <Textarea
              value={formData.footer_policies.privacy_policy?.content || ""}
              onChange={(e) => handlePolicyChange("privacy_policy", "content", e.target.value)}
              placeholder="Enter your privacy policy..."
              disabled={isReadOnly}
              rows={4}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg resize-none"
            />
          </div>

          {/* Refund Policy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Refund Policy</Label>
              {!isReadOnly && formData.legal_name && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPolicy("refund_policy")}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Use Default
                </Button>
              )}
            </div>
            <Textarea
              value={formData.footer_policies.refund_policy?.content || ""}
              onChange={(e) => handlePolicyChange("refund_policy", "content", e.target.value)}
              placeholder="Enter your refund policy..."
              disabled={isReadOnly}
              rows={4}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg resize-none"
            />
          </div>

          {/* FAQs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">FAQs</Label>
              {!isReadOnly && formData.legal_name && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPolicy("faqs")}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Use Default
                </Button>
              )}
            </div>
            <Textarea
              value={formData.footer_policies.faqs?.content || ""}
              onChange={(e) => handlePolicyChange("faqs", "content", e.target.value)}
              placeholder="Enter frequently asked questions..."
              disabled={isReadOnly}
              rows={4}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg resize-none"
            />
          </div>

          {/* Contact Us */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Contact Us</Label>
              {!isReadOnly && formData.legal_name && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPolicy("contact_us")}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Use Default
                </Button>
              )}
            </div>
            <Textarea
              value={formData.footer_policies.contact_us?.content || ""}
              onChange={(e) => handlePolicyChange("contact_us", "content", e.target.value)}
              placeholder="Enter contact information..."
              disabled={isReadOnly}
              rows={4}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg resize-none"
            />
          </div>
        </div>
      </div>

      {/* Support Channels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-muted-foreground" />
            <Label className="text-foreground/70 text-sm font-medium">
              Support Channels
            </Label>
          </div>
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSupportChannel}
              className="bg-secondary border-border text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          )}
        </div>

        {formData.support_channels.length === 0 ? (
          <div className="text-center p-6 rounded-xl bg-secondary/50 border border-dashed border-border">
            <Headphones className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No support channels configured. Add ways for customers to reach you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.support_channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border"
              >
                <Select
                  value={channel.type}
                  onChange={(e) =>
                    handleSupportChannelChange(channel.id, "type", e.target.value)
                  }
                  disabled={isReadOnly}
                  className="w-32 h-9 bg-background border-border text-foreground rounded-lg"
                >
                  {SUPPORT_CHANNEL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>

                <Input
                  value={channel.value}
                  onChange={(e) =>
                    handleSupportChannelChange(channel.id, "value", e.target.value)
                  }
                  placeholder={
                    channel.type === "email"
                      ? "support@example.com"
                      : channel.type === "phone"
                      ? "+1 234 567 890"
                      : "Contact value"
                  }
                  disabled={isReadOnly}
                  className="flex-1 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                />

                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSupportChannel(channel.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-foreground/70 text-sm font-medium">
              Social Links
            </Label>
          </div>
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSocialLink}
              className="bg-secondary border-border text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          )}
        </div>

        {formData.social_links.length === 0 ? (
          <div className="text-center p-6 rounded-xl bg-secondary/50 border border-dashed border-border">
            <Share2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No social links added. Connect with your audience on social media.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.social_links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border"
              >
                <Select
                  value={link.platform}
                  onChange={(e) =>
                    handleSocialLinkChange(link.id, "platform", e.target.value)
                  }
                  disabled={isReadOnly}
                  className="w-32 h-9 bg-background border-border text-foreground rounded-lg"
                >
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </option>
                  ))}
                </Select>

                <Input
                  value={link.url}
                  onChange={(e) =>
                    handleSocialLinkChange(link.id, "url", e.target.value)
                  }
                  placeholder="https://"
                  disabled={isReadOnly}
                  className="flex-1 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                />

                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSocialLink(link.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

