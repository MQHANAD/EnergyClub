"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Application } from "@/types";
import {
  Check,
  X,
  Square,
  CheckSquare,
  Trash2,
  Download,
  Mail,
  AlertCircle,
} from "lucide-react";

export interface BulkActionToolbarProps {
  selectedApplications: Application[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAccept: (applications: Application[]) => void;
  onBulkReject: (applications: Application[]) => void;
  onBulkExport?: (applications: Application[]) => void;
  onBulkEmail?: (applications: Application[]) => void;
  totalApplications: number;
  isProcessing?: boolean;
  className?: string;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedApplications,
  onSelectAll,
  onClearSelection,
  onBulkAccept,
  onBulkReject,
  onBulkExport,
  onBulkEmail,
  totalApplications,
  isProcessing = false,
  className,
}) => {
  const [showConfirm, setShowConfirm] = useState<"accept" | "reject" | null>(
    null
  );

  const selectedCount = selectedApplications.length;
  const isAllSelected =
    selectedCount === totalApplications && totalApplications > 0;
  const hasSelection = selectedCount > 0;

  // Filter selected applications by status
  const pendingSelected = selectedApplications.filter(
    (app) => app.status === "pending"
  );
  const acceptedSelected = selectedApplications.filter(
    (app) => app.status === "accepted"
  );
  const rejectedSelected = selectedApplications.filter(
    (app) => app.status === "rejected"
  );

  const handleBulkAction = (action: "accept" | "reject") => {
    if (action === "accept" && pendingSelected.length > 0) {
      onBulkAccept(pendingSelected);
    } else if (action === "reject" && pendingSelected.length > 0) {
      onBulkReject(pendingSelected);
    }
    setShowConfirm(null);
  };

  const ConfirmDialog = ({ action }: { action: "accept" | "reject" }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle
            className={cn(
              "h-6 w-6",
              action === "accept" ? "text-green-600" : "text-red-600"
            )}
          />
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Bulk {action === "accept" ? "Accept" : "Reject"}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to {action} {pendingSelected.length} pending
          application{pendingSelected.length !== 1 ? "s" : ""}? This action
          cannot be easily undone.
        </p>

        <div className="flex space-x-3">
          <Button
            onClick={() => handleBulkAction(action)}
            disabled={isProcessing}
            className={cn(
              action === "accept"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {action === "accept" ? "Accept" : "Reject"} {pendingSelected.length}{" "}
            Application{pendingSelected.length !== 1 ? "s" : ""}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConfirm(null)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-between p-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={isAllSelected ? onClearSelection : onSelectAll}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                aria-label={isAllSelected ? "Deselect all" : "Select all"}
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
                <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300" />

            <div className="text-sm text-gray-600">
              <span className="font-semibold text-yellow-700">
                {selectedCount}
              </span>{" "}
              of {totalApplications} selected
              {pendingSelected.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({pendingSelected.length} pending)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Status Actions */}
            {pendingSelected.length > 0 && (
              <>
                <Button
                  onClick={() => setShowConfirm("accept")}
                  disabled={isProcessing}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept ({pendingSelected.length})
                </Button>

                <Button
                  onClick={() => setShowConfirm("reject")}
                  disabled={isProcessing}
                  size="sm"
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject ({pendingSelected.length})
                </Button>
              </>
            )}

            {/* Utility Actions */}
            {onBulkExport && (
              <Button
                onClick={() => onBulkExport(selectedApplications)}
                disabled={isProcessing}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}

            {onBulkEmail && (
              <Button
                onClick={() => onBulkEmail(selectedApplications)}
                disabled={isProcessing}
                variant="outline"
                size="sm"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}

            <div className="h-4 w-px bg-gray-300" />

            <Button
              onClick={onClearSelection}
              disabled={isProcessing}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Status breakdown */}
        {(acceptedSelected.length > 0 || rejectedSelected.length > 0) && (
          <div className="px-4 pb-3 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              {pendingSelected.length > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span>{pendingSelected.length} pending</span>
                </span>
              )}
              {acceptedSelected.length > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{acceptedSelected.length} accepted</span>
                </span>
              )}
              {rejectedSelected.length > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{rejectedSelected.length} rejected</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span>Processing applications...</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {showConfirm && <ConfirmDialog action={showConfirm} />}
    </>
  );
};

export default BulkActionToolbar;
