"use client";

import { useState } from "react";
import { ShoppingCart, Unlock, Zap, CreditCard, Banknote, Smartphone, Tag, CalendarClock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtMoney } from "./ReceiptTemplate";
import type { CartItem, PayMethod } from "../posTypes";

interface Settings {
    allow_discount: boolean;
    max_discount_percent: number;
    default_payment: string;
    vat_enabled: boolean;
    vat_rate: number;
    vat_inclusive: boolean;
    require_cash_session: boolean;
    enable_installments: boolean;
    hide_product_names_on_receipt: boolean;
}

const METHODS: { value: PayMethod; label: string; icon: React.ElementType }[] = [
    { value: "cash",        label: "Cash",        icon: Banknote    },
    { value: "gcash",       label: "GCash",       icon: Smartphone  },
    { value: "card",        label: "Card",        icon: CreditCard  },
    { value: "others",      label: "Others",      icon: Tag         },
    { value: "installment", label: "Installment", icon: CalendarClock },
];

interface FastCashierLayoutProps {
    cart: CartItem[];
    subtotal: number;
    itemCount: number;
    currency: string;
    settings: Settings | null;
    error: string | null;
    loading: boolean;
    canCollectPayments: boolean;
    sessionBlocked: boolean;
    onUpdateQty: (key: string, delta: number) => void;
    onRemove: (key: string) => void;
    onClear: () => void;
    onCheckout: (data: { payment_method: PayMethod; payment_amount: number; discount_percent: number; customer_name: string }) => void;
    onQueue: () => void;
    onStartSession: () => void;
}

export function FastCashierLayout({
    cart, subtotal, itemCount, currency, settings, error, loading, canCollectPayments, sessionBlocked, onUpdateQty, onRemove, onClear, onCheckout, onQueue, onStartSession
}: FastCashierLayoutProps) {
    const [method, setMethod] = useState<PayMethod>((settings?.default_payment ?? "cash") as PayMethod);
    const [tender, setTender] = useState("");
    const [discount, setDiscount] = useState("");
    const [customer, setCustomer] = useState("");

    const maxDiscount = settings?.max_discount_percent ?? 100;
    const discountPct = Math.min(Math.max(parseFloat(discount) || 0, 0), maxDiscount);
    const discountAmount = Math.round((subtotal * discountPct / 100) * 100) / 100;
    const afterDiscount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const vatRate = settings?.vat_enabled && !settings?.vat_inclusive ? settings.vat_rate ?? 0 : 0;
    const vatAmount = Math.round((afterDiscount * vatRate / 100) * 100) / 100;
    const total = Math.round((afterDiscount + vatAmount) * 100) / 100;
    const tenderAmount = method === "cash" ? parseFloat(tender) || 0 : total;
    const change = Math.max(0, tenderAmount - total);
    const canCheckout = cart.length > 0 && canCollectPayments && !loading && (method !== "cash" || tenderAmount >= total);

    const appendTender = (value: string) => setTender(prev => value === "." && prev.includes(".") ? prev : (prev === "0" ? value : prev + value));
    const clearTender = () => setTender("");
    const backspaceTender = () => setTender(prev => prev.slice(0, -1));
    const roundTo = (step: number) => Math.ceil(total / step) * step;
    const suggested = Array.from(new Set([total, roundTo(50), roundTo(100), roundTo(500)].filter(v => v >= total))).slice(0, 4);

    const submit = () => {
        if (!canCollectPayments) {
            onQueue();
            return;
        }
        if (sessionBlocked) {
            onStartSession();
            return;
        }
        onCheckout({
            payment_method: method,
            payment_amount: method === "cash" ? tenderAmount : total,
            discount_percent: discountPct,
            customer_name: customer.trim(),
        });
    };

    return (
        <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(160px,1fr)_minmax(300px,1fr)] overflow-hidden bg-background lg:grid-cols-[minmax(420px,1fr)_minmax(340px,430px)] lg:grid-rows-1 xl:grid-cols-[minmax(520px,1fr)_440px]">
            <div className="min-h-0 flex flex-col border-b border-border bg-card lg:border-b-0 lg:border-r">
                <div className="shrink-0 px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-black text-foreground">Order Cart</p>
                            <p className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""} in current order</p>
                        </div>
                        {cart.length > 0 && (
                            <button type="button" onClick={onClear} className="h-8 px-2.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted">
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
                    {cart.length === 0 ? (
                        <div className="h-full min-h-40 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <ShoppingCart className="h-11 w-11 opacity-20 mb-2" />
                            <p className="text-sm font-bold">Order cart is empty</p>
                            <p className="mt-1 max-w-xs text-xs">Search or scan a product above, then choose one of the suggested items.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.key} className="flex items-center gap-2 py-3 border-b border-border/60 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-foreground truncate">{item.name}</p>
                                    {item.variant_name && <p className="text-[10px] text-muted-foreground">{item.variant_name}</p>}
                                    <p className="text-xs font-semibold text-primary tabular-nums">{fmtMoney(item.price, currency)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={() => onUpdateQty(item.key, -1)} className="h-8 w-8 rounded-lg border border-border font-black hover:bg-muted">-</button>
                                    <span className="w-8 text-center text-sm font-black tabular-nums">{item.qty}</span>
                                    <button type="button" onClick={() => onUpdateQty(item.key, 1)} disabled={item.qty >= item.stock} className="h-8 w-8 rounded-lg border border-border font-black hover:bg-muted disabled:opacity-30">+</button>
                                </div>
                                <div className="w-20 text-right">
                                    <p className="text-sm font-black tabular-nums text-foreground">{fmtMoney(item.price * item.qty, currency)}</p>
                                    <button type="button" onClick={() => onRemove(item.key)} className="text-[10px] font-semibold text-destructive">Remove</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="shrink-0 border-t border-border bg-background/70 p-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Items</p>
                            <p className="text-lg font-black tabular-nums text-foreground">{itemCount}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Lines</p>
                            <p className="text-lg font-black tabular-nums text-foreground">{cart.length}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-right">
                            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Subtotal</p>
                            <p className="text-lg font-black tabular-nums text-primary">{fmtMoney(subtotal, currency)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex flex-col bg-card h-full">
                <div className="shrink-0 border-b border-border px-4 py-3">
                    <p className="text-sm font-black text-foreground">Payment</p>
                    <p className="text-xs text-muted-foreground">Discount, tender, and checkout stay visible.</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {METHODS.filter(m => m.value !== "installment").map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setMethod(value)}
                                className={cn(
                                    "h-10 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95",
                                    method === value ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:bg-muted text-foreground",
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-[1fr_92px] gap-2">
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</label>
                            <input value={customer} onChange={e => setCustomer(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground" placeholder="Optional" />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Disc %</label>
                            <input value={discount} onChange={e => setDiscount(e.target.value)} inputMode="decimal" className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary text-foreground" placeholder="0" />
                        </div>
                    </div>

                    {method === "cash" && (
                        <div className="space-y-2">
                            <div className="h-12 rounded-xl bg-muted/40 border border-border/80 px-3 flex items-center justify-between text-foreground">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount Received</span>
                                <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                                    {tender ? fmtMoney(tenderAmount, currency) : fmtMoney(0, currency)}
                                </span>
                            </div>
                            
                            {total > 0 && suggested.length > 0 && (
                                <div className="grid grid-cols-4 gap-1.5">
                                    {suggested.map(value => (
                                        <button key={value} type="button" onClick={() => setTender(String(value))} className="h-8 rounded-lg border border-border text-[11px] font-bold text-foreground hover:bg-muted transition-colors">
                                            {value === total ? "Exact" : fmtMoney(value, currency)}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-4 gap-1.5">
                                {["7","8","9","C","4","5","6","Back","1","2","3",".","00","0","000","Exact"].map(key => {
                                    const isSpecial = key === "C" || key === "Back" || key === "Exact";
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                if (key === "C") clearTender();
                                                else if (key === "Back") backspaceTender();
                                                else if (key === "Exact") setTender(String(total));
                                                else appendTender(key);
                                            }}
                                            className={cn(
                                                "h-12 rounded-xl border transition-all active:scale-95 duration-100 flex items-center justify-center",
                                                key === "C" && "text-rose-500 border-rose-200/50 bg-rose-500/5 hover:bg-rose-500/10 font-bold text-lg",
                                                key === "Back" && "text-amber-500 border-amber-200/50 bg-amber-500/5 hover:bg-amber-500/10 font-bold text-xs",
                                                key === "Exact" && "bg-primary text-primary-foreground border-primary hover:bg-primary/90 font-bold shadow-sm text-xs",
                                                !isSpecial && "border-border/60 bg-background text-foreground font-semibold hover:bg-muted text-lg"
                                            )}
                                        >
                                            {key}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
                        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmtMoney(subtotal, currency)}</span></div>
                        {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{fmtMoney(discountAmount, currency)}</span></div>}
                        {vatAmount > 0 && <div className="flex justify-between text-muted-foreground"><span>VAT</span><span>{fmtMoney(vatAmount, currency)}</span></div>}
                        <div className="flex justify-between border-t border-border/70 pt-2 text-lg font-black text-foreground"><span>Total</span><span>{fmtMoney(total, currency)}</span></div>
                        {method === "cash" && <div className="flex justify-between text-base font-black text-primary"><span>Change</span><span>{fmtMoney(change, currency)}</span></div>}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
                        </div>
                    )}
                </div>
                <div className="shrink-0 border-t border-border bg-card p-3 sm:p-4">
                    <Button className="h-14 w-full text-base font-black gap-2" disabled={!cart.length || (!canCheckout && !sessionBlocked && canCollectPayments)} onClick={submit}>
                        {loading ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : sessionBlocked ? <Unlock className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                        {!canCollectPayments ? "PRINT QR" : sessionBlocked ? "Start Session" : `Checkout ${fmtMoney(total, currency)}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
