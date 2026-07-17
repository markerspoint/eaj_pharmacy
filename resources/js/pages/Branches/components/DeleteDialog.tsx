import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useBranchDelete } from "../hooks/brancheshooks";
import type { Branch } from "../types/branchestypes";

interface DeleteDialogProps {
    branch: Branch;
    onClose: () => void;
}

export function DeleteDialog({ branch, onClose }: DeleteDialogProps) {
    const {
        reason,
        setReason,
        loading,
        error,
        handleDelete,
    } = useBranchDelete(branch, onClose);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground">Delete branch?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-semibold">{branch.name}</span>
                            <span className="font-mono ml-1.5 opacity-60">({branch.code})</span>
                        </p>
                    </div>
                </div>

                {/* Warnings if branch has dependents */}
                {(branch.users_count > 0 || branch.product_stocks_count > 0) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 space-y-1">
                        {branch.users_count > 0 && (
                            <p>⚠ {branch.users_count} user{branch.users_count !== 1 ? "s" : ""} assigned to this branch</p>
                        )}
                        {branch.product_stocks_count > 0 && (
                            <p>⚠ {branch.product_stocks_count.toLocaleString()} stock record{branch.product_stocks_count !== 1 ? "s" : ""} attached</p>
                        )}
                    </div>
                )}

                <div>
                    <label className="field-label">Reason (optional)</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                        placeholder="e.g. Branch closed permanently…"
                        className="w-full mt-1 text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground text-foreground" />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-9" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant="destructive" className="flex-1 h-9 gap-2" onClick={handleDelete} disabled={loading}>
                        {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground animate-spin" />}
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}
