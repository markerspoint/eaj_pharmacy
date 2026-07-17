"use client";

import { ShoppingCart, Trash2, Minus, Plus, X, QrCode, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "./ReceiptTemplate";
import type { CartItem } from "../posTypes";

interface CartPanelProps {
    cart: CartItem[];
    subtotal: number;
    itemCount: number;
    currency: string;
    error: string | null;
    canCharge: boolean;
    orderOnly?: boolean;
    onUpdateQty: (key: string, d: number) => void;
    onRemove: (key: string) => void;
    onClear: () => void;
    onCharge: () => void;
    onQueue: () => void;
}

export function CartPanel({
    cart, subtotal, itemCount, currency, error, canCharge, orderOnly, onUpdateQty, onRemove, onClear, onCharge, onQueue
}: CartPanelProps) {
    return (
        <div className="flex flex-col bg-card h-full">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">Cart</span>
                    {itemCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">{itemCount}</span>
                    )}
                </div>
                {cart.length > 0 && (
                    <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />Clear
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-4 text-center">
                        <ShoppingCart className="h-10 w-10 opacity-15" />
                        <div>
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-xs opacity-60 mt-1">Select a product to add it<br />Press F9 to checkout</p>
                        </div>
                    </div>
                ) : (
                    <div className="px-3 py-2">
                        {cart.map(item => (
                            <div key={item.key} className="group flex items-start gap-2 py-2.5 border-b border-border/50 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground leading-snug break-words">{item.name}</p>
                                    {item.variant_name && <p className="text-[10px] text-muted-foreground mt-0.5">{item.variant_name}</p>}
                                    <p className="text-xs font-bold text-primary tabular-nums mt-0.5">{fmtMoney(item.price, currency)}</p>
                                </div>
                                <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onUpdateQty(item.key, -1)}
                                            className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                                        <button onClick={() => onUpdateQty(item.key, 1)} disabled={item.qty >= item.stock}
                                            className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30">
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold tabular-nums text-foreground">{fmtMoney(item.price * item.qty, currency)}</span>
                                        <button onClick={() => onRemove(item.key)}
                                            className="h-4 w-4 rounded flex items-center justify-center text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {cart.length > 0 && (
                <div className="shrink-0 border-t border-border p-4 space-y-3">
                    <div className="flex items-end justify-between">
                        <span className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subtotal</p>
                            <p className="text-2xl font-bold tabular-nums text-foreground">{fmtMoney(subtotal, currency)}</p>
                        </div>
                    </div>
                    {orderOnly ? (
                        <Button variant="outline" className="h-12 w-full text-sm font-bold gap-2" onClick={onQueue}>
                            <QrCode className="h-4 w-4" />PRINT QR
                        </Button>
                    ) : (
                        <Button className="h-12 w-full text-sm font-bold gap-2" onClick={onCharge} disabled={!canCharge}>
                            <Zap className="h-4 w-4" />Checkout
                        </Button>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
