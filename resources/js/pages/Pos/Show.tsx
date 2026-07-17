"use client";

import { usePage, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import ReceiptTemplate, { type ReceiptData } from "./components/ReceiptTemplate";
import { VoidDialog } from "./components/VoidDialog";
import { routes } from "@/routes";
import { cn } from "@/lib/utils";
import {
    ArrowLeft, Edit2, XCircle, AlertTriangle, CheckCircle2,
    ShoppingCart, Calendar, User, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/date";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PageProps {
    sale: ReceiptData & { id: number };
    app:  { currency: string };
    auth: { user: { is_admin: boolean; is_super_admin: boolean; fname: string } | null };
    [key: string]: unknown;
}



// ─── Show page ────────────────────────────────────────────────────────────────
export default function PosShow() {
    const { props }  = usePage<PageProps>();
    const { sale, app, auth } = props;
    const currency   = app?.currency ?? "₱";
    const user       = auth?.user;

    const [showVoid,  setShowVoid]  = useState(false);
    const [voidLoading, setVoidLoading] = useState(false);
    const [voidError, setVoidError] = useState<string | null>(null);

    const isVoided   = sale.status === "voided";
    const canVoid    = !isVoided && (user?.is_admin || user?.is_super_admin);
    const canEdit    = !isVoided;

    const handleVoid = (reason: string) => {
        setVoidLoading(true);
        setVoidError(null);
        router.post(routes.pos.void(sale.id), { reason }, {
            preserveScroll: true,
            onSuccess: () => { setShowVoid(false); setVoidLoading(false); },
            onError: (e) => { setVoidError(Object.values(e)[0] as string); setVoidLoading(false); },
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-xl mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href={routes.sales.history()}>
                            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Receipt</h1>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{sale.receipt_number}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Link href={routes.pos.edit(sale.id)}>
                                <Button variant="outline" size="sm" className="gap-2 h-8">
                                    <Edit2 className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {canVoid && (
                            <Button variant="outline" size="sm"
                                className="gap-2 h-8 text-destructive border-destructive/30 hover:bg-destructive/5"
                                onClick={() => setShowVoid(true)}>
                                <XCircle className="h-3.5 w-3.5" />
                                Void
                            </Button>
                        )}
                    </div>
                </div>

                {/* Void error */}
                {voidError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {voidError}
                    </div>
                )}

                {/* Status banner */}
                <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border",
                    isVoided
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"
                        : "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40"
                )}>
                    {isVoided
                        ? <XCircle   className="h-5 w-5 text-destructive shrink-0" />
                        : <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />}
                    <div>
                        <p className={cn("text-sm font-semibold",
                            isVoided ? "text-destructive" : "text-green-800 dark:text-green-300")}>
                            {isVoided ? "This sale has been voided" : "Sale completed"}
                        </p>
                        <p className={cn("text-xs mt-0.5",
                            isVoided ? "text-destructive/70" : "text-green-600 dark:text-green-500")}>
                            {fmtDate(sale.created_at, "MMMM d, yyyy · h:mm a")}
                        </p>
                    </div>
                </div>

                {/* Meta info row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { icon: ShoppingCart, label: "Items",   value: `${sale.items.length} item${sale.items.length !== 1 ? "s" : ""}` },
                        { icon: User,         label: "Created By", value: sale.order_created_by ?? sale.cashier },
                        { icon: User,         label: "Payment By", value: sale.payment_received_by ?? sale.cashier },
                        { icon: CreditCard,   label: "Method",  value: (sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)) },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                            <div className="flex justify-center mb-1.5">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Receipt */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <ReceiptTemplate
                        sale={sale}
                        currency={currency}
                        showActions={true}
                    />
                </div>

            </div>

            {showVoid && (
                <VoidDialog
                    onConfirm={handleVoid}
                    onClose={() => setShowVoid(false)}
                    loading={voidLoading}
                />
            )}
        </AdminLayout>
    );
}
