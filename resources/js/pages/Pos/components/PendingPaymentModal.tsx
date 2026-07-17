"use client";

import { useState } from "react";
import { QrCode, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney } from "./ReceiptTemplate";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { QueuedOrder } from "../posTypes";

interface PendingPaymentModalProps {
    orders: QueuedOrder[];
    currency: string;
    activeOrderId: number | null;
    onSelect: (order: QueuedOrder) => void;
    onDelete: (order: QueuedOrder) => void;
    onClose: () => void;
}

export function PendingPaymentModal({
    orders, currency, activeOrderId, onSelect, onDelete, onClose
}: PendingPaymentModalProps) {
    const [orderToRemove, setOrderToRemove] = useState<QueuedOrder | null>(null);

    const confirmRemove = () => {
        if (!orderToRemove) return;
        onDelete(orderToRemove);
        setOrderToRemove(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/45 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[86vh]">
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                        <QrCode className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-bold truncate">Pending Payment</span>
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                            {orders.length}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 px-4 text-center text-muted-foreground">
                            <QrCode className="h-7 w-7 opacity-20 mb-2" />
                            <p className="text-xs font-medium">No pending orders</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1.5">
                            {orders.map(order => {
                                const active = activeOrderId === order.id;

                                return (
                                    <div
                                        key={order.id}
                                        className={cn(
                                            "relative w-full text-left rounded-lg border px-3 py-2.5 pr-9 transition-colors",
                                            active
                                                ? "border-primary bg-primary/8"
                                                : "border-border bg-background hover:bg-muted/50 hover:border-primary/30",
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOrderToRemove(order)}
                                            className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
                                            title="Remove pending order"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="flex items-start justify-between gap-2">
                                            <button type="button" onClick={() => onSelect(order)} className="min-w-0 flex-1 text-left">
                                                <p className="text-xs font-black text-foreground font-mono truncate">{order.ticket_number}</p>
                                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{order.listed_by ?? "Order taker"}</p>
                                            </button>
                                            <p className="shrink-0 text-xs font-black text-primary tabular-nums">{fmtMoney(order.total, currency)}</p>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <span className="text-[10px] text-muted-foreground">{order.items.length} line{order.items.length !== 1 ? "s" : ""}</span>
                                            <button type="button" onClick={() => onSelect(order)} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={!!orderToRemove} onOpenChange={(open) => !open && setOrderToRemove(null)}>
                <DialogContent className="sm:max-w-md" showCloseButton={false}>
                    <DialogHeader>
                        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <DialogTitle>Remove Pending Order</DialogTitle>
                        <DialogDescription>
                            This will remove the unpaid ticket from the pending payment list.
                        </DialogDescription>
                    </DialogHeader>

                    {orderToRemove && (
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-sm font-black text-foreground">
                                    {orderToRemove.ticket_number}
                                </span>
                                <span className="text-sm font-black tabular-nums text-primary">
                                    {fmtMoney(orderToRemove.total, currency)}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span className="truncate">{orderToRemove.customer_name || orderToRemove.listed_by || "Walk-in customer"}</span>
                                <span>{orderToRemove.items.length} line{orderToRemove.items.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToRemove(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmRemove}>Remove Order</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
