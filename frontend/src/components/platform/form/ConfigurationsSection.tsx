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
} from "lucide-react";

// ============ Payment Gateway Settings ============
function PaymentGatewayCard() {
  const { toast } = useToast();
  const { hasProFeatures } = usePlan();
  const { data: gatewayData } = useGetPaymentGatewaySettingsQuery(undefined, {
    skip: !hasProFeatures,
  });
  const [createGateway, { isLoading: isCreating }] = useCreatePaymentGatewaySettingsMutation();
  const [updateGateway, { isLoading: isUpdating }] = useUpdatePaymentGatewaySettingsMutation();
  const [deleteGateway, { isLoading: isDeleting }] = useDeletePaymentGatewaySettingsMutation();

  const [formData, setFormData] = useState({ key: "", secret: "" });

  useEffect(() => {
    if (gatewayData?.data) {
      setFormData({
        key: gatewayData.data.key || "",
        secret: gatewayData.data.secret || "",
      });
    }
  }, [gatewayData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (gatewayData?.data) {
        await updateGateway(formData).unwrap();
        toast({ title: "Settings Updated", description: "Payment gateway settings updated successfully" });
      } else {
        await createGateway(formData).unwrap();
        toast({ title: "Settings Created", description: "Payment gateway settings created successfully" });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to save settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGateway().unwrap();
      setFormData({ key: "", secret: "" });
      toast({ title: "Deleted", description: "Payment gateway settings deleted" });
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to delete settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const isLocked = !hasProFeatures;
  const isSaving = isCreating || isUpdating;

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
        <form onSubmit={handleSubmit}>
          <div className={isLocked ? "opacity-40 pointer-events-none" : ""}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs">API Key</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, secret: e.target.value }))}
                  placeholder="Enter Razorpay API secret"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isLocked ? (
              <UpgradeButton size="sm" tooltipText="Upgrade to Pro to use your own payment gateway" />
            ) : (
              <>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Save
                </Button>
                {gatewayData?.data && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============ Domain Settings ============
function DomainCard() {
  const { toast } = useToast();
  const { hasProFeatures } = usePlan();
  const { data: domainData } = useGetDomainSettingsQuery(undefined, {
    skip: !hasProFeatures,
  });
  const [createDomain, { isLoading: isCreating }] = useCreateDomainSettingsMutation();
  const [updateDomain, { isLoading: isUpdating }] = useUpdateDomainSettingsMutation();
  const [deleteDomain, { isLoading: isDeleting }] = useDeleteDomainSettingsMutation();

  const [formData, setFormData] = useState({ domain: "", subdomain: "" });

  useEffect(() => {
    if (domainData?.data) {
      setFormData({
        domain: domainData.data.domain || "",
        subdomain: domainData.data.subdomain || "",
      });
    }
  }, [domainData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (domainData?.data) {
        await updateDomain(formData).unwrap();
        toast({ title: "Domain Updated", description: "Your domain will be connected within 48 hours" });
      } else {
        await createDomain(formData).unwrap();
        toast({ title: "Domain Created", description: "Your domain will be connected within 48 hours" });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to save settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDomain().unwrap();
      setFormData({ domain: "", subdomain: "" });
      toast({ title: "Deleted", description: "Domain settings deleted" });
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to delete settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const isLocked = !hasProFeatures;
  const isSaving = isCreating || isUpdating;

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
        <form onSubmit={handleSubmit}>
          <div className={isLocked ? "opacity-40 pointer-events-none" : ""}>
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs">Domain Name</Label>
                <Input
                  value={formData.domain}
                  onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value, subdomain: e.target.value }))}
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
          <div className="flex gap-2">
            {isLocked ? (
              <UpgradeButton size="sm" tooltipText="Upgrade to Pro to use a custom domain" />
            ) : (
              <>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Save
                </Button>
                {domainData?.data && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============ Payment Receiver Settings ============
function PaymentReceiverCard() {
  const { toast } = useToast();
  const { hasProFeatures } = usePlan();
  const { data: receiverData } = useGetPaymentReceiverSettingsQuery(undefined, {
    skip: !hasProFeatures,
  });
  const [createReceiver, { isLoading: isCreating }] = useCreatePaymentReceiverSettingsMutation();
  const [updateReceiver, { isLoading: isUpdating }] = useUpdatePaymentReceiverSettingsMutation();
  const [deleteReceiver, { isLoading: isDeleting }] = useDeletePaymentReceiverSettingsMutation();

  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    pan: "",
    gstin: "",
    upi_phone_number: "",
    upi_id: "",
  });

  useEffect(() => {
    if (receiverData?.data) {
      setFormData({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (receiverData?.data) {
        await updateReceiver(formData).unwrap();
        toast({ title: "Details Updated", description: "Payment receiver details updated successfully" });
      } else {
        await createReceiver(formData).unwrap();
        toast({ title: "Details Created", description: "Payment receiver details created successfully" });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || "Failed to save settings";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReceiver().unwrap();
      setFormData({
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

  const isLocked = !hasProFeatures;
  const isSaving = isCreating || isUpdating;

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
        <form onSubmit={handleSubmit}>
          <div className={isLocked ? "opacity-40 pointer-events-none" : ""}>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Holder Name</Label>
                  <Input
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, account_holder_name: e.target.value }))}
                    placeholder="Account holder name"
                    disabled={isLocked}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Number</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, account_number: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, ifsc_code: e.target.value }))}
                    placeholder="IFSC code"
                    disabled={isLocked}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PAN</Label>
                  <Input
                    value={formData.pan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pan: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, gstin: e.target.value }))}
                    placeholder="GSTIN"
                    disabled={isLocked}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">UPI Phone Number</Label>
                  <Input
                    value={formData.upi_phone_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, upi_phone_number: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, upi_id: e.target.value }))}
                  placeholder="UPI ID"
                  disabled={isLocked}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isLocked ? (
              <UpgradeButton size="sm" tooltipText="Upgrade to Pro to receive payments directly" />
            ) : (
              <>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Save
                </Button>
                {receiverData?.data && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============ Main Configurations Section ============
export function ConfigurationsSection() {
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
        <PaymentGatewayCard />
        <DomainCard />
        <PaymentReceiverCard />
      </div>
    </div>
  );
}

