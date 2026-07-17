"use client";

import { QrCode, X, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "./ReceiptTemplate";
import type { QueuedOrder } from "../posTypes";

interface QueuedOrderModalProps {
    order: QueuedOrder;
    currency: string;
    onClose: () => void;
}

export function QueuedOrderModal({ order, currency, onClose }: QueuedOrderModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl flex flex-col max-h-[92vh]">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0 print:hidden">
                    <div className="p-1.5 rounded-full bg-primary/10">
                        <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">Order listed</p>
                        <p className="text-xs text-muted-foreground font-mono">{order.ticket_number}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    <div className="mx-auto w-[280px] bg-white text-black p-5 rounded-sm print:w-full print:p-0">
                        <div className="text-center border-b border-dashed border-black/40 pb-3">
                            <p className="text-lg font-black">ORDER TICKET</p>
                            <p className="font-mono text-sm">{order.ticket_number}</p>
                            {order.customer_name && <p className="text-sm mt-1">{order.customer_name}</p>}
                        </div>
                        <div className="flex justify-center py-4">
                            <QRCodeSVG value={order.qr_token} size={150} level="M" />
                        </div>
                        <p className="text-center font-mono text-xs tracking-widest">{order.qr_token}</p>
                        <div className="my-3 border-y border-dashed border-black/40 py-2 space-y-1">
                            {order.items.map((item, index) => (
                                <div key={`${item.product_id}-${item.variant_id ?? "base"}-${index}`} className="flex gap-2 text-xs">
                                    <span className="w-6 text-right">{item.quantity}x</span>
                                    <span className="flex-1">{item.product_name}{item.variant_name ? ` (${item.variant_name})` : ""}</span>
                                    <span>{fmtMoney(item.total, currency)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-sm font-black">
                            <span>Total</span>
                            <span>{fmtMoney(order.total, currency)}</span>
                        </div>
                        <p className="mt-3 text-center text-[10px] uppercase tracking-wide">Present this for payment</p>
                    </div>
                </div>
                <div className="px-4 pb-5 pt-3 border-t border-border shrink-0 print:hidden grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-11 font-bold" onClick={onClose}>Done</Button>
                    <Button className="h-11 font-bold gap-2" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />Print
                    </Button>
                </div>
            </div>
        </div>
    );
}
