"use client";

import { Link } from "@inertiajs/react";
import { Eye, X, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/date";
import { routes } from "@/routes";
import ReceiptTemplate, { type ReceiptData } from "./ReceiptTemplate";
import { MethodChip } from "./MethodChip";

interface SaleRow extends ReceiptData {
    id: number;
    item_count: number;
    table_label?: string | null;
}

interface ReceiptDrawerProps {
    sale: SaleRow;
    currency: string;
    businessType?: string;
    onClose: () => void;
}

export function ReceiptDrawer({ sale, currency, businessType, onClose }: ReceiptDrawerProps) {
    const saleWithMeta = { ...sale, business_type: businessType };
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:w-96 bg-card border-l border-border flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
                    <div>
                        <p className="font-bold text-foreground font-mono text-sm">{sale.receipt_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtDate(sale.created_at, "MMMM d, yyyy · h:mm a")}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Link href={routes.pos.show(sale.id)}>
                            <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="View full page">
                                <Eye className="h-3.5 w-3.5" />
                            </button>
                        </Link>
                        <button onClick={onClose}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Status + chips */}
                <div className="px-5 py-3 flex items-center gap-2 flex-wrap border-b border-border shrink-0">
                    <span className={cn("badge text-[10px] font-bold capitalize",
                        sale.status === "completed" ? "badge-completed" : "badge-voided")}>
                        {sale.status}
                    </span>
                    <MethodChip method={sale.payment_method} />
                    {sale.customer_name && (
                        <span className="text-xs text-muted-foreground">👤 {sale.customer_name}</span>
                    )}
                    {sale.table_label && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Table2 className="h-3 w-3" />{sale.table_label}
                        </span>
                    )}
                </div>

                {/* Receipt */}
                <div className="flex-1 overflow-y-auto p-5">
                    <ReceiptTemplate sale={saleWithMeta} currency={currency} showActions={true} />
                </div>
            </div>
        </div>
    );
}
