"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/ui/upgrade-button";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/hooks/use-toast";
import {
  useGetPaymentGatewaySettingsQuery,
  useCreatePaymentGatewaySettingsMutation,
  useUpdatePaymentGatewaySettingsMutation,
  useDeletePaymentGatewaySettingsMutation,
  useGetDomainSettingsQuery,
  useCreateDomainSettingsMutation,
  useUpdateDomainSettingsMutation,
  useDeleteDomainSettingsMutation,
  useGetPaymentReceiverSettingsQuery,
  useCreatePaymentReceiverSettingsMutation,
  useUpdatePaymentReceiverSettingsMutation,
  useDeletePaymentReceiverSettingsMutation,
} from "@/store/api";
import {
  Settings,
  CreditCard,
  Globe,
  Wallet,
  Crown,
  Lock,
  Loader2,
  Trash2,
  Save,
} from "lucide-react";

// ============ Payment Gateway Settings ============
interface PaymentGatewayCardProps {
  formData: { key: string; secret: string };
  onChange: (data: { key: string; secret: string }) => void;
  onDelete: () => void;
  isDeleting: boolean;
  hasExistingData: boolean;
}

function PaymentGatewayCard({ formData, onChange, onDelete, isDeleting, hasExistingData }: PaymentGatewayCardProps) {
  const { hasProFeatures } = usePlan();
  const isLocked = !hasProFeatures;

  return (
    <Card className={`transition-all ${isLocked ? "border-muted bg-muted/5" : "border-border"}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            <CreditCard className={`h-5 w-5 ${isLocked ? "text-muted-foreground" : "text-primary"}`} />
            <div>
              <CardTitle className={`text-base ${isLocked ? "text-muted-foreground" : ""}`}>
                Payment Gateway
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your Razorpay credentials
              </p>
            </div>
          </div>
          {isLocked && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Crown className="h-3 w-3" />
              Pro
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={isLocked ? "opacity-40 pointer-events-none" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">API Key</Label>
              <Input
                value={formData.key}
                onChange={(e) => onChange({ ...formData, key: e.target.value })}
                placeholder="Enter Razorpay API key"
                disabled={isLocked}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">API Secret</Label>
              <Input
                type="password"
                value={formData.secret}
                onChange={(e) => onChange({ ...formData, secret: e.target.value })}
                placeholder="Enter Razorpay API secret"
                disabled={isLocked}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
        {!isLocked && hasExistingData && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Domain Settings ============
interface DomainCardProps {
  formData: { domain: string; subdomain: string };
  onChange: (data: { domain: string; subdomain: string }) => void;
  onDelete: () => void;
  isDeleting: boolean;
  hasExistingData: boolean;
}

function DomainCard({ formData, onChange, onDelete, isDeleting, hasExistingData }: DomainCardProps) {
  const { hasProFeatures } = usePlan();
  const isLocked = !hasProFeatures;

  return (
    <Card className={`transition-all ${isLocked ? "border-muted bg-muted/5" : "border-border"}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            <Globe className={`h-5 w-5 ${isLocked ? "text-muted-foreground" : "text-primary"}`} />
            <div>
              <CardTitle className={`text-base ${isLocked ? "text-muted-foreground" : ""}`}>
                Custom Domain
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set up your custom domain
              </p>
            </div>
          </div>
          {isLocked && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Crown className="h-3 w-3" />
              Pro
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={isLocked ? "opacity-40 pointer-events-none" : ""}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Domain Name</Label>
              <Input
                value={formData.domain}
                onChange={(e) => onChange({ domain: e.target.value, subdomain: e.target.value })}
                placeholder="app.yourdomain.com"
                disabled={isLocked}
                className="h-9 text-sm"
              />
            </div>
            
            {/* DNS Instructions */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs font-medium text-foreground mb-2">DNS Setup:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div><strong>Type:</strong> A Record</div>
                <div><strong>Host:</strong> @ or subdomain</div>
                <div><strong>Value:</strong> 94.136.185.171</div>
              </div>
            </div>
          </div>
        </div>
        {!isLocked && hasExistingData && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Payment Receiver Settings ============
interface PaymentReceiverCardProps {
  formData: {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    pan: string;
    gstin: string;
    upi_phone_number: string;
    upi_id: string;
  };
  onChange: (data: PaymentReceiverCardProps["formData"]) => void;
  onDelete: () => void;
  isDeleting: boolean;
  hasExistingData: boolean;
}

function PaymentReceiverCard({ formData, onChange, onDelete, isDeleting, hasExistingData }: PaymentReceiverCardProps) {
  const { hasProFeatures } = usePlan();
  const isLocked = !hasProFeatures;

  return (
    <Card className={`transition-all ${isLocked ? "border-muted bg-muted/5" : "border-border"}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            <Wallet className={`h-5 w-5 ${isLocked ? "text-muted-foreground" : "text-primary"}`} />
            <div>
              <CardTitle className={`text-base ${isLocked ? "text-muted-foreground" : ""}`}>
                Payment Receiver
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bank account for direct payments
              </p>
            </div>
          </div>
          {isLocked && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Crown className="h-3 w-3" />
              Pro
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={isLocked ? "opacity-40 pointer-events-none" : ""}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Holder Name</Label>
                <Input
                  value={formData.account_holder_name}
                  onChange={(e) => onChange({ ...formData, account_holder_name: e.target.value })}
                  placeholder="Account holder name"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account Number</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => onChange({ ...formData, account_number: e.target.value })}
                  placeholder="Bank account number"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">IFSC Code</Label>
                <Input
                  value={formData.ifsc_code}
                  onChange={(e) => onChange({ ...formData, ifsc_code: e.target.value })}
                  placeholder="IFSC code"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">PAN</Label>
                <Input
                  value={formData.pan}
                  onChange={(e) => onChange({ ...formData, pan: e.target.value })}
                  placeholder="PAN"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => onChange({ ...formData, gstin: e.target.value })}
                  placeholder="GSTIN"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UPI Phone Number</Label>
                <Input
                  value={formData.upi_phone_number}
                  onChange={(e) => onChange({ ...formData, upi_phone_number: e.target.value })}
                  placeholder="UPI phone number"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">UPI ID</Label>
              <Input
                value={formData.upi_id}
                onChange={(e) => onChange({ ...formData, upi_id: e.target.value })}
                placeholder="UPI ID"
                disabled={isLocked}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
        {!isLocked && hasExistingData && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Main Configurations Section ============
export function ConfigurationsSection() {
  const { toast } = useToast();
  const { hasProFeatures } = usePlan();
  
  // Queries
  const { data: gatewayData } = useGetPaymentGatewaySettingsQuery(undefined, {
    skip: !hasProFeatures,
  });
  const { data: domainData } = useGetDomainSettingsQuery(undefined, {
    skip: !hasProFeatures,
  });
  const { data: receiverData } = useGetPaymentReceiverSettingsQuery(undefined, {
    skip: !hasProFeatures,
  });

  // Mutations
  const [createGateway, { isLoading: isCreatingGateway }] = useCreatePaymentGatewaySettingsMutation();
  const [updateGateway, { isLoading: isUpdatingGateway }] = useUpdatePaymentGatewaySettingsMutation();
  const [deleteGateway, { isLoading: isDeletingGateway }] = useDeletePaymentGatewaySettingsMutation();
  
  const [createDomain, { isLoading: isCreatingDomain }] = useCreateDomainSettingsMutation();
  const [updateDomain, { isLoading: isUpdatingDomain }] = useUpdateDomainSettingsMutation();
  const [deleteDomain, { isLoading: isDeletingDomain }] = useDeleteDomainSettingsMutation();
  
  const [createReceiver, { isLoading: isCreatingReceiver }] = useCreatePaymentReceiverSettingsMutation();
  const [updateReceiver, { isLoading: isUpdatingReceiver }] = useUpdatePaymentReceiverSettingsMutation();
  const [deleteReceiver, { isLoading: isDeletingReceiver }] = useDeletePaymentReceiverSettingsMutation();

  // Form state
  const [gatewayFormData, setGatewayFormData] = useState({ key: "", secret: "" });
  const [domainFormData, setDomainFormData] = useState({ domain: "", subdomain: "" });
  const [receiverFormData, setReceiverFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    pan: "",
    gstin: "",
    upi_phone_number: "",
    upi_id: "",
  });

  // Load existing data
  useEffect(() => {
    if (gatewayData?.data) {
      setGatewayFormData({
        key: gatewayData.data.key || "",
        secret: gatewayData.data.secret || "",
      });
    }
  }, [gatewayData]);

  useEffect(() => {
    if (domainData?.data) {
      setDomainFormData({
        domain: domainData.data.domain || "",
        subdomain: domainData.data.subdomain || "",
      });
    }
  }, [domainData]);

  useEffect(() => {
    if (receiverData?.data) {
      setReceiverFormData({
        account_holder_name: receiverData.data.account_holder_name || "",
        account_number: receiverData.data.account_number || "",
        ifsc_code: receiverData.data.ifsc_code || "",
        pan: receiverData.data.pan || "",
        gstin: receiverData.data.gstin || "",
        upi_phone_number: receiverData.data.upi_phone_number || "",
        upi_id: receiverData.data.upi_id || "",
      });
    }
  }, [receiverData]);

  // Save all configurations
  const handleSaveAll = async () => {
    try {
      const promises: Promise<unknown>[] = [];

      // Save payment gateway if there's data
      if (gatewayFormData.key || gatewayFormData.secret) {
        if (gatewayData?.data) {
          promises.push(updateGateway(gatewayFormData).unwrap());
        } else {
          promises.push(createGateway(gatewayFormData).unwrap());
        }
      }

      // Save domain if there's data
      if (domainFormData.domain) {
        if (domainData?.data) {
          promises.push(updateDomain(domainFormData).unwrap());
        } else {
          promises.push(createDomain(domainFormData).unwrap());
        }
      }

      // Save payment receiver if there's data
      if (
        receiverFormData.account_holder_name ||
        receiverFormData.account_number ||
        receiverFormData.ifsc_code ||
        receiverFormData.pan ||
        receiverFormData.gstin ||
        receiverFormData.upi_phone_number ||
        receiverFormData.upi_id
      ) {
        if (receiverData?.data) {
          promises.push(updateReceiver(receiverFormData).unwrap());
        } else {
          promises.push(createReceiver(receiverFormData).unwrap());
        }
      }

      if (promises.length === 0) {
        toast({ title: "No changes to save", description: "Please fill in at least one configuration" });
        return;
      }

      await Promise.all(promises);
      toast({ title: "Settings Saved", description: "All configurations saved successfully" });
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to save settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  // Delete handlers
  const handleDeleteGateway = async () => {
    try {
      await deleteGateway().unwrap();
      setGatewayFormData({ key: "", secret: "" });
      toast({ title: "Deleted", description: "Payment gateway settings deleted" });
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to delete settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDeleteDomain = async () => {
    try {
      await deleteDomain().unwrap();
      setDomainFormData({ domain: "", subdomain: "" });
      toast({ title: "Deleted", description: "Domain settings deleted" });
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to delete settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDeleteReceiver = async () => {
    try {
      await deleteReceiver().unwrap();
      setReceiverFormData({
        account_holder_name: "",
        account_number: "",
        ifsc_code: "",
        pan: "",
        gstin: "",
        upi_phone_number: "",
        upi_id: "",
      });
      toast({ title: "Deleted", description: "Payment receiver settings deleted" });
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to delete settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const isSaving =
    isCreatingGateway ||
    isUpdatingGateway ||
    isCreatingDomain ||
    isUpdatingDomain ||
    isCreatingReceiver ||
    isUpdatingReceiver;

  const isLocked = !hasProFeatures;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
          <Settings className="h-5 w-5" />
          Pro Configurations
        </h3>
        <p className="text-sm text-muted-foreground">
          Payment gateway, custom domain, and direct payments
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="grid gap-4">
        <PaymentGatewayCard
          formData={gatewayFormData}
          onChange={setGatewayFormData}
          onDelete={handleDeleteGateway}
          isDeleting={isDeletingGateway}
          hasExistingData={!!gatewayData?.data}
        />
        <DomainCard
          formData={domainFormData}
          onChange={setDomainFormData}
          onDelete={handleDeleteDomain}
          isDeleting={isDeletingDomain}
          hasExistingData={!!domainData?.data}
        />
        <PaymentReceiverCard
          formData={receiverFormData}
          onChange={setReceiverFormData}
          onDelete={handleDeleteReceiver}
          isDeleting={isDeletingReceiver}
          hasExistingData={!!receiverData?.data}
        />
      </div>

      {/* Save All Button */}
      {!isLocked && (
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSaveAll} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Configurations
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

