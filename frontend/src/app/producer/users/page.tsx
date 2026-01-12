"use client";

import { useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import {
  useGetViewerAccessQuery,
  useGetTicketsQuery,
  useGrantAccessMutation,
  useBulkImportAccessMutation,
  useValidateCSVMutation,
  useRevokeAccessMutation,
  useDeleteAccessMutation,
  useGetAccessStatsQuery,
  ViewerAccess,
  ViewerAccessStatus,
  ValidateCSVResult,
} from "@/store/api";
import {
  UsersBackground,
  UsersFilters,
  UsersTable,
  UsersPagination,
  UsersStats,
  GrantAccessDialog,
  BulkImportDialog,
  ConfirmDialog,
} from "@/components/users";

function UsersContent() {
  const { toast } = useToast();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ViewerAccessStatus | "">("");
  const [page, setPage] = useState(1);

  // Dialog state
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<ViewerAccess | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateCSVResult | null>(null);

  // API hooks
  const { data: accessData, isLoading } = useGetViewerAccessQuery({
    page,
    page_size: 20,
    status: statusFilter || undefined,
    search: search || undefined,
    sort_by: "granted_at",
    sort_order: "desc",
  });

  const { data: ticketsData } = useGetTicketsQuery({
    page: 1,
    page_size: 100,
    status: "published",
  });

  const { data: stats, isLoading: statsLoading } = useGetAccessStatsQuery();

  const [grantAccess, { isLoading: isGranting }] = useGrantAccessMutation();
  const [bulkImport, { isLoading: isImporting }] = useBulkImportAccessMutation();
  const [validateCSV, { isLoading: isValidating }] = useValidateCSVMutation();
  const [revokeAccess, { isLoading: isRevoking }] = useRevokeAccessMutation();
  const [deleteAccess, { isLoading: isDeleting }] = useDeleteAccessMutation();

  const accessGrants = accessData?.data || [];
  const totalPages = accessData?.total_pages || 1;
  const tickets = ticketsData?.data || [];

  // Grant access handlers
  const handleOpenGrantDialog = useCallback(() => {
    setIsGrantDialogOpen(true);
  }, []);

  const handleCloseGrantDialog = useCallback(() => {
    setIsGrantDialogOpen(false);
  }, []);

  const handleGrantAccess = useCallback(async (data: {
    emails: string[];
    ticket_ids: number[];
    expires_at?: string;
    notify: boolean;
  }) => {
    try {
      const result = await grantAccess({
        emails: data.emails,
        ticket_ids: data.ticket_ids,
        expires_at: data.expires_at,
        notify: data.notify,
      }).unwrap();
      
      // If all grants failed, show the error message from the first failure
      if (result.total_granted === 0 && result.failed.length > 0) {
        const firstFailure = result.failed[0];
        toast({
          title: "Access Grant Failed",
          description: firstFailure.reason || "Failed to grant access. Please check your ticket balance.",
          variant: "destructive",
        });
      } else if (result.total_failed > 0) {
        // Some succeeded, some failed - show partial success with failure details
        const failureReasons = result.failed.map(f => f.reason).filter(Boolean);
        const uniqueReasons = [...new Set(failureReasons)];
        toast({
          title: "Partial Success",
          description: `${result.total_granted} user(s) granted access. ${result.total_failed} failed.${uniqueReasons.length > 0 ? ` ${uniqueReasons[0]}` : ""}`,
          variant: result.total_granted > 0 ? "default" : "destructive",
        });
      } else {
        // All succeeded
        toast({
          title: "Access Granted",
          description: `${result.total_granted} user(s) granted access to ${data.ticket_ids.length} ticket(s).`,
        });
        setIsGrantDialogOpen(false);
      }
    } catch (error: any) {
      // Handle API errors
      const errorMessage = error?.data?.message || error?.message || "Failed to grant access. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [grantAccess, toast]);

  // Bulk import handlers
  const handleOpenBulkImport = useCallback(() => {
    setValidationResult(null);
    setIsBulkImportOpen(true);
  }, []);

  const handleCloseBulkImport = useCallback(() => {
    setIsBulkImportOpen(false);
    setValidationResult(null);
  }, []);

  const handleValidateCSV = useCallback(async (csvData: string) => {
    try {
      const result = await validateCSV({ csv_data: csvData }).unwrap();
      setValidationResult(result);
    } catch {
      toast({
        title: "Validation Error",
        description: "Failed to validate CSV data.",
        variant: "destructive",
      });
    }
  }, [validateCSV, toast]);

  const handleBulkImport = useCallback(async (data: {
    csv_data: string;
    ticket_id: number;
    expires_at?: string;
    notify: boolean;
  }) => {
    try {
      const result = await bulkImport(data).unwrap();
      
      // If all grants failed, show the error message from the first failure
      if (result.grant_result.total_granted === 0 && result.grant_result.failed.length > 0) {
        const firstFailure = result.grant_result.failed[0];
        toast({
          title: "Import Failed",
          description: firstFailure.reason || "Failed to import users. Please check your ticket balance.",
          variant: "destructive",
        });
      } else if (result.grant_result.total_failed > 0) {
        // Some succeeded, some failed - show partial success with failure details
        const failureReasons = result.grant_result.failed.map(f => f.reason).filter(Boolean);
        const uniqueReasons = [...new Set(failureReasons)];
        toast({
          title: "Import Complete (Partial)",
          description: `${result.grant_result.total_granted} user(s) imported. ${result.grant_result.total_failed} failed.${uniqueReasons.length > 0 ? ` ${uniqueReasons[0]}` : ""}`,
          variant: result.grant_result.total_granted > 0 ? "default" : "destructive",
        });
        setIsBulkImportOpen(false);
        setValidationResult(null);
      } else {
        // All succeeded
        toast({
          title: "Import Complete",
          description: `${result.grant_result.total_granted} user(s) imported successfully.`,
        });
        setIsBulkImportOpen(false);
        setValidationResult(null);
      }
    } catch (error: any) {
      // Handle API errors
      const errorMessage = error?.data?.message || error?.message || "Failed to import users. Please try again.";
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [bulkImport, toast]);

  // Revoke handlers
  const handleOpenRevokeDialog = useCallback((grant: ViewerAccess) => {
    setSelectedGrant(grant);
    setIsRevokeDialogOpen(true);
  }, []);

  const handleCloseRevokeDialog = useCallback(() => {
    setIsRevokeDialogOpen(false);
    setSelectedGrant(null);
  }, []);

  const handleRevokeAccess = useCallback(async () => {
    if (!selectedGrant) return;
    try {
      await revokeAccess(selectedGrant.id).unwrap();
      toast({
        title: "Access Revoked",
        description: `Access for ${selectedGrant.email} has been revoked.`,
      });
      setIsRevokeDialogOpen(false);
      setSelectedGrant(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    }
  }, [revokeAccess, selectedGrant, toast]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((grant: ViewerAccess) => {
    setSelectedGrant(grant);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedGrant(null);
  }, []);

  const handleDeleteAccess = useCallback(async () => {
    if (!selectedGrant) return;
    try {
      await deleteAccess(selectedGrant.id).unwrap();
      toast({
        title: "Access Deleted",
        description: `Access record for ${selectedGrant.email} has been deleted.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedGrant(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete access. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteAccess, selectedGrant, toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <UsersBackground />

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <UsersFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onGrantAccess={handleOpenGrantDialog}
          onBulkImport={handleOpenBulkImport}
        />

        {/* <UsersStats stats={stats} isLoading={statsLoading} /> */}

        <UsersTable
          accessGrants={accessGrants}
          isLoading={isLoading}
          onRevoke={handleOpenRevokeDialog}
          onDelete={handleOpenDeleteDialog}
        />

        <UsersPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </main>

      {/* Dialogs */}
      <GrantAccessDialog
        isOpen={isGrantDialogOpen}
        tickets={tickets}
        isSubmitting={isGranting}
        onClose={handleCloseGrantDialog}
        onSubmit={handleGrantAccess}
      />

      <BulkImportDialog
        isOpen={isBulkImportOpen}
        tickets={tickets}
        isSubmitting={isImporting}
        isValidating={isValidating}
        validationResult={validationResult}
        onClose={handleCloseBulkImport}
        onValidate={handleValidateCSV}
        onSubmit={handleBulkImport}
      />

      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        title="Revoke Access"
        message={`Are you sure you want to revoke access for ${selectedGrant?.email}? They will no longer be able to use this ticket access.`}
        confirmText="Revoke"
        confirmVariant="destructive"
        isLoading={isRevoking}
        onClose={handleCloseRevokeDialog}
        onConfirm={handleRevokeAccess}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Access"
        message={`Are you sure you want to permanently delete the access record for ${selectedGrant?.email}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={isDeleting}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteAccess}
      />
    </div>
  );
}

export default function ProducerUsersPage() {
  return (
    <ProtectedRoute>
      <UsersContent />
    </ProtectedRoute>
  );
}

