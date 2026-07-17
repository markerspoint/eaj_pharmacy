"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoidDialogProps {
    onConfirm: (reason: string) => void;
    onClose: () => void;
    loading: boolean;
}

export function VoidDialog({ onConfirm, onClose, loading }: VoidDialogProps) {
    const [reason, setReason] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Void this sale?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Stock will be restored automatically.</p>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Reason (optional)
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Customer changed mind, Wrong item scanned…"
                        rows={2}
                        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-9" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" className="flex-1 h-9 gap-2" onClick={() => onConfirm(reason)} disabled={loading}>
                        {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                        Void sale
                    </Button>
                </div>
            </div>
        </div>
    );
}
