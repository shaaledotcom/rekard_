"use client";

import { useState, useCallback } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle2, Ticket, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Ticket as TicketType, ValidateCSVResult } from "@/store/api";

interface BulkImportDialogProps {
  isOpen: boolean;
  tickets: TicketType[];
  isSubmitting: boolean;
  isValidating: boolean;
  validationResult: ValidateCSVResult | null;
  onClose: () => void;
  onValidate: (csvData: string) => void;
  onSubmit: (data: { csv_data: string; ticket_id: number; expires_at?: string; notify: boolean }) => void;
}

export function BulkImportDialog({
  isOpen,
  tickets,
  isSubmitting,
  isValidating,
  validationResult,
  onClose,
  onValidate,
  onSubmit,
}: BulkImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const [ticketId, setTicketId] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notify, setNotify] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvData(text);
        onValidate(text);
      };
      reader.readAsText(file);
    }
  }, [onValidate]);

  const handleClose = useCallback(() => {
    setCsvData("");
    setTicketId("");
    setExpiresAt("");
    setNotify(false);
    onClose();
  }, [onClose]);

  // Early return after all hooks
  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvData(text);
        onValidate(text);
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (text: string) => {
    setCsvData(text);
    if (text.trim()) {
      onValidate(text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvData.trim() || ticketId === "") return;

    onSubmit({
      csv_data: csvData,
      ticket_id: ticketId as number,
      expires_at: expiresAt || undefined,
      notify,
    });
  };

  const downloadSampleCSV = () => {
    const sample = `email,name
john@example.com,John Doe
jane@example.com,Jane Smith
viewer@test.com,`;
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Bulk Import</h2>
              <p className="text-sm text-muted-foreground">Import users from CSV</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Selection */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4 text-violet-500" />
              Ticket
            </Label>
            <Select
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value ? Number(e.target.value) : "")}
              className="h-11 bg-secondary/50 border-border rounded-xl"
              required
            >
              <option value="">Select a ticket...</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.title}
                </option>
              ))}
            </Select>
          </div>

          {/* CSV Upload Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">CSV Data</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={downloadSampleCSV}
                className="text-violet-500 hover:text-violet-600 p-0 h-auto"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download Sample
              </Button>
            </div>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragOver 
                  ? "border-violet-500 bg-violet-500/10" 
                  : "border-border hover:border-violet-500/50"
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop a CSV file here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Format: email,name (name is optional)
              </p>
            </div>

            {/* Or paste directly */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or paste directly</span>
              </div>
            </div>

            <Textarea
              value={csvData}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="email,name&#10;john@example.com,John Doe&#10;jane@example.com,Jane Smith"
              className="min-h-[120px] bg-secondary/50 border-border rounded-xl font-mono text-sm"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-xl border ${
              validationResult.invalid_count > 0 
                ? "border-yellow-500/30 bg-yellow-500/10" 
                : "border-emerald-500/30 bg-emerald-500/10"
            }`}>
              <div className="flex items-start gap-3">
                {validationResult.invalid_count > 0 ? (
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {validationResult.valid_count} valid email{validationResult.valid_count !== 1 ? "s" : ""}
                    {validationResult.invalid_count > 0 && (
                      <span className="text-yellow-600"> • {validationResult.invalid_count} invalid</span>
                    )}
                  </p>
                  {validationResult.invalid_count > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="text-muted-foreground mb-1">Invalid entries:</p>
                      <ul className="space-y-1">
                        {validationResult.invalid.slice(0, 5).map((inv, i) => (
                          <li key={i} className="text-yellow-600 text-xs">
                            Row {inv.row}: {inv.reason} ({inv.data})
                          </li>
                        ))}
                        {validationResult.invalid.length > 5 && (
                          <li className="text-muted-foreground text-xs">
                            ...and {validationResult.invalid.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notify */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notify-bulk"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="h-4 w-4 rounded border-border text-violet-600 focus:ring-violet-500"
            />
            <Label htmlFor="notify-bulk" className="text-sm text-muted-foreground cursor-pointer">
              Send notification emails to users
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isValidating || ticketId === "" || !csvData.trim() || (validationResult?.valid_count || 0) === 0}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              {isSubmitting ? "Importing..." : `Import ${validationResult?.valid_count || 0} Users`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

