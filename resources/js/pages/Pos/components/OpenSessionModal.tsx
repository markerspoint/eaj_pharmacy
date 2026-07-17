"use client";

import { useRef, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { Unlock, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/routes";
import { fmtMoney } from "./ReceiptTemplate";

interface OpenSessionModalProps {
    currency: string;
    onClose: () => void;
}

export function OpenSessionModal({ currency, onClose }: OpenSessionModalProps) {
    const amountRef = useRef<HTMLInputElement>(null);
    const [amount, setAmount] = useState(() => localStorage.getItem("pos:lastOpeningCash") ?? "0");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const openingCash = Math.max(0, parseFloat(amount) || 0);

    useEffect(() => {
        setTimeout(() => {
            amountRef.current?.focus();
            amountRef.current?.select();
        }, 50);
    }, []);

    const openSession = () => {
        setLoading(true);
        setError("");
        router.post(routes.cashSessions.open(), {
            opening_cash: openingCash,
            notes: notes.trim() || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                localStorage.setItem("pos:lastOpeningCash", String(openingCash));
                setLoading(false);
                onClose();
                router.reload({ only: ["session"] });
            },
            onError: errors => {
                setError(Object.values(errors)[0] as string ?? "Unable to start cash session.");
                setLoading(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/45 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <p className="font-bold text-foreground flex items-center gap-2">
                            <Unlock className="h-4 w-4 text-emerald-500" /> Start Cash Session
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Enter drawer opening cash.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Opening cash</label>
                        <input
                            ref={amountRef}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            inputMode="decimal"
                            className="w-full h-12 rounded-xl border border-border bg-background px-3 text-xl font-black tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[0, 500, 1000, 2000].map(value => (
                            <button key={value} type="button" onClick={() => setAmount(String(value))}
                                className="h-9 rounded-lg border border-border text-xs font-bold hover:bg-muted">
                                {value === 0 ? "Zero" : fmtMoney(value, currency)}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Optional"
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
                        </div>
                    )}
                </div>
                <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-11 font-bold" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button className="h-11 font-bold gap-2" onClick={openSession} disabled={loading}>
                        {loading ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Unlock className="h-4 w-4" />}
                        Start
                    </Button>
                </div>
            </div>
        </div>
    );
}
