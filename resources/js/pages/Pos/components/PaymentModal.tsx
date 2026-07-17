"use client";

import { useState } from "react";
import {
    X, Tag, User, CalendarClock, AlertTriangle, Zap,
    CreditCard, Banknote, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtMoney } from "./ReceiptTemplate";
import type { ActivePromo, CartItem, PayMethod } from "../posTypes";

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

interface PaymentModalProps {
    subtotal: number;
    settings: Settings | null;
    currency: string;
    customerNameRequired?: boolean;
    promos: ActivePromo[];
    cart: CartItem[];
    onConfirm: (d: {
        payment_method: PayMethod;
        payment_amount: number;
        customer_name: string;
        discount_percent: number;
        promo_id: number | null;
        installment_provider?: string;
        installment_reference?: string;
        installment_customer_phone?: string;
        installment_down_payment?: number;
        installments_count?: number;
        installment_notes?: string;
    }) => void;
    onClose: () => void;
    loading: boolean;
    serverError?: string | null;
}

export function PaymentModal({
    subtotal, settings, currency, customerNameRequired, promos, cart, onConfirm, onClose, loading, serverError
}: PaymentModalProps) {
    const enableInstallments = settings?.enable_installments ?? false;
    const [method,       setMethod]       = useState<PayMethod>((settings?.default_payment ?? "cash") as PayMethod);
    const [tender,       setTender]       = useState("");
    const [customer,     setCustomer]     = useState("");
    const [discPct,      setDiscPct]      = useState("");
    const [promoCode,    setPromoCode]    = useState("");
    const [appliedPromo, setAppliedPromo] = useState<ActivePromo | null>(null);
    const [promoError,   setPromoError]   = useState("");
    const [showPromos,   setShowPromos]   = useState(false);
    
    // Financing / installment fields
    const [instProvider,   setInstProvider]   = useState<"home_credit" | "skyro" | "other">("home_credit");
    const [instReference,  setInstReference]  = useState("");
    const [instPhone,      setInstPhone]      = useState("");
    const [instDown,       setInstDown]       = useState("0");
    const [instCount,      setInstCount]      = useState("6");
    const [instNotes,      setInstNotes]      = useState("");

    const isInstallment = method === "installment";

    const r2 = (v: number) => Math.round(v * 100) / 100; // round to 2 decimal places — matches PHP round($v, 2)

    const disc      = Math.min(parseFloat(discPct) || 0, settings?.max_discount_percent ?? 100);
    const discAmt   = r2(subtotal * disc / 100);
    const afterDisc = r2(subtotal - discAmt);

    const promoAppliesToCart = (p: ActivePromo) => {
        if (p.applies_to === 'all') return true;
        if (p.applies_to === 'specific_products') return cart.some(i => p.product_ids.includes(i.product_id));
        return p.category_ids.length > 0;
    };
    
    const computePromoAmt = (p: ActivePromo | null) => {
        if (!p) return 0;
        if (p.minimum_purchase && afterDisc < p.minimum_purchase) return 0;
        return p.discount_type === 'percent'
            ? r2(afterDisc * p.discount_value / 100)
            : Math.min(r2(p.discount_value), afterDisc);
    };
    
    const promoAmt   = computePromoAmt(appliedPromo);
    const afterPromo = r2(afterDisc - promoAmt);
    const vatRate    = (settings?.vat_enabled && !settings?.vat_inclusive) ? (settings.vat_rate ?? 0) : 0;
    const vatAmt     = r2(afterPromo * vatRate / 100);
    const total      = afterPromo + vatAmt;
    const tenderN    = parseFloat(tender) || 0;
    const change     = Math.max(0, tenderN - total);
    const isCash     = method === "cash";
    const downN      = parseFloat(instDown) || 0;
    
    const canPay     = total > 0
        && (!isCash || tenderN >= total)
        && (!customerNameRequired || customer.trim().length > 0)
        && (!isInstallment || (customer.trim().length > 0 && !!instProvider && parseInt(instCount) >= 1 && downN >= 0));
        
    const append     = (v: string) => setTender(p => (p === "0" || p === "") ? v : p + v);
    const backspace  = () => setTender(p => p.slice(0, -1));

    const eligiblePromos  = promos.filter(promoAppliesToCart);
    const noCodePromos    = eligiblePromos.filter(p => !p.code);
    const codePromos      = eligiblePromos.filter(p => !!p.code);

    const applyPromoCode = () => {
        setPromoError("");
        const code = promoCode.trim().toUpperCase();
        if (!code) return;
        const found = promos.find(p => p.code?.toUpperCase() === code);
        if (!found) { setPromoError("Promo code not found or expired."); return; }
        if (!promoAppliesToCart(found)) { setPromoError("This promo does not apply to any item in the cart."); return; }
        if (found.minimum_purchase && afterDisc < found.minimum_purchase) {
            setPromoError("Minimum purchase of " + fmtMoney(found.minimum_purchase, currency) + " required."); return;
        }
        if (computePromoAmt(found) <= 0) { setPromoError("This promo gives no discount on the current cart total."); return; }
        setAppliedPromo(found); setPromoError(""); setShowPromos(false);
    };
    
    const applyDirect = (p: ActivePromo) => {
        if (p.minimum_purchase && afterDisc < p.minimum_purchase) {
            setPromoError("Minimum purchase of " + fmtMoney(p.minimum_purchase, currency) + " required for " + p.name + "."); return;
        }
        setAppliedPromo(p); setPromoError(""); setShowPromos(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[92vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <p className="font-bold text-foreground">Checkout</p>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Order summary */}
                    <div className="bg-muted/30 rounded-xl p-3.5 space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmtMoney(subtotal, currency)}</span></div>
                        {disc > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Discount ({disc}%)</span><span>−{fmtMoney(discAmt, currency)}</span></div>}
                        {promoAmt > 0 && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                <span className="flex items-center gap-1.5"><Tag className="h-3 w-3" />{appliedPromo?.name}</span>
                                <span>−{fmtMoney(promoAmt, currency)}</span>
                            </div>
                        )}
                        {vatAmt > 0 && <div className="flex justify-between text-muted-foreground"><span>VAT ({vatRate}%)</span><span>+{fmtMoney(vatAmt, currency)}</span></div>}
                        <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2 mt-1"><span>Total</span><span>{fmtMoney(total, currency)}</span></div>
                    </div>

                    {/* Discount */}
                    {settings?.allow_discount && (
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Discount %</label>
                            <div className="flex gap-2 flex-wrap">
                                <input value={discPct} onChange={e => setDiscPct(e.target.value)} placeholder="0" type="number" min="0" max={settings.max_discount_percent}
                                    className="h-9 w-20 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
                                {[5, 10, 20].filter(v => v <= (settings.max_discount_percent ?? 100)).map(v => (
                                    <button key={v} onClick={() => setDiscPct(String(v))}
                                        className={cn("h-9 px-3 rounded-lg border text-sm font-medium transition-all", disc === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
                                        {v}%
                                    </button>
                                ))}
                                {disc > 0 && <button onClick={() => setDiscPct("")} className="h-9 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted">Clear</button>}
                            </div>
                        </div>
                    )}

                    {/* Promos */}
                    {eligiblePromos.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Promo {!appliedPromo && <span className="ml-2 text-emerald-600 dark:text-emerald-400">{eligiblePromos.length} available</span>}
                                </label>
                                {!appliedPromo && <button onClick={() => setShowPromos(v => !v)} className="text-[10px] text-primary hover:underline">{showPromos ? "Hide" : "Browse promos"}</button>}
                            </div>
                            {appliedPromo ? (
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                    <Tag className="h-4 w-4 text-emerald-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{appliedPromo.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {appliedPromo.discount_type === 'percent' ? `${appliedPromo.discount_value}% off` : `₱${appliedPromo.discount_value.toFixed(2)} off`}
                                            {appliedPromo.code && <span className="ml-1.5 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">{appliedPromo.code}</span>}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">−{fmtMoney(promoAmt, currency)}</p>
                                        <button onClick={() => { setAppliedPromo(null); setPromoCode(""); setPromoError(""); }} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <input value={promoCode}
                                                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                                                onKeyDown={e => e.key === 'Enter' && applyPromoCode()}
                                                placeholder="Enter promo code…"
                                                className="w-full h-9 pl-9 pr-3 text-sm font-mono tracking-wider bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal" />
                                        </div>
                                        <button onClick={applyPromoCode} disabled={!promoCode.trim()}
                                            className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0">
                                            Apply
                                        </button>
                                    </div>
                                    {promoError && <p className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0" />{promoError}</p>}
                                    {noCodePromos.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Available promos</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {noCodePromos.map(p => {
                                                    const amt    = computePromoAmt(p);
                                                    const locked = !!(p.minimum_purchase && afterDisc < p.minimum_purchase);
                                                    return (
                                                        <button key={p.id} onClick={() => !locked && applyDirect(p)} disabled={locked}
                                                            className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all",
                                                                locked ? "border-border text-muted-foreground/50 cursor-not-allowed"
                                                                    : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10")}>
                                                            <Tag className="h-3 w-3 shrink-0" />
                                                            <span>{p.name}</span>
                                                            {amt > 0 && <span className="font-bold">−{fmtMoney(amt, currency)}</span>}
                                                            {locked && <span className="text-[9px] opacity-60">min {fmtMoney(p.minimum_purchase!, currency)}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {showPromos && codePromos.length > 0 && (
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">Code-required promos</p>
                                            <div className="divide-y divide-border">
                                                {codePromos.map(p => {
                                                    const amt    = computePromoAmt(p);
                                                    const locked = !!(p.minimum_purchase && afterDisc < p.minimum_purchase);
                                                    return (
                                                        <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                                                            <div className="flex-1 min-w-0">
                                                                 <p className="text-sm font-semibold text-foreground">{p.name}</p>
                                                                 <div className="flex items-center gap-2 mt-0.5">
                                                                     <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.code}</span>
                                                                     <span className="text-xs text-muted-foreground">{p.discount_type === 'percent' ? `${p.discount_value}%` : `₱${p.discount_value.toFixed(2)}`} off</span>
                                                                     {p.minimum_purchase && <span className="text-xs text-muted-foreground/60">min {fmtMoney(p.minimum_purchase, currency)}</span>}
                                                                 </div>
                                                            </div>
                                                            {amt > 0 && !locked && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">−{fmtMoney(amt, currency)}</span>}
                                                            {locked && <span className="text-xs text-muted-foreground/50 shrink-0">locked</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer name */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                            Customer name {customerNameRequired && <span className="text-destructive">*</span>}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={customer} onChange={e => setCustomer(e.target.value)}
                                placeholder={customerNameRequired ? "Required for this service" : "Walk-in customer"}
                                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
                        </div>
                    </div>

                    {/* Payment method */}
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Payment method</label>
                        <div className={cn("grid gap-1.5", enableInstallments ? "grid-cols-5" : "grid-cols-4")}>
                            {METHODS.filter(m => m.value !== "installment" || enableInstallments).map(m => { const Icon = m.icon; return (
                                <button key={m.value} onClick={() => setMethod(m.value)}
                                    className={cn("flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-[11px] font-semibold transition-all active:scale-95",
                                        method === m.value ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border hover:border-primary/40 hover:bg-accent text-foreground")}>
                                    <Icon className="h-4 w-4" />{m.label}
                                </button>
                            ); })}
                        </div>
                    </div>

                    {/* Financing details panel */}
                    {isInstallment && (
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" /> Financing Details
                            </p>

                            {/* Provider — required */}
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                                    Financing Provider <span className="text-destructive">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(["home_credit","skyro","other"] as const).map(p => (
                                        <button key={p} type="button" onClick={() => setInstProvider(p)}
                                            className={cn("h-9 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                                                instProvider === p
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-border text-foreground hover:border-primary/40 hover:bg-accent")}>
                                            {p === "home_credit" ? "Home Credit" : p === "skyro" ? "Skyro" : "Other"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference / Application number */}
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Application / Reference No. <span className="text-muted-foreground/50">(optional)</span></label>
                                <input value={instReference} onChange={e => setInstReference(e.target.value)}
                                    placeholder="e.g. HC-2024-XXXXXX"
                                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
                            </div>

                            {/* Customer phone */}
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Customer Phone <span className="text-muted-foreground/50">(optional)</span></label>
                                <input value={instPhone} onChange={e => setInstPhone(e.target.value)}
                                    placeholder="e.g. 09XX-XXX-XXXX"
                                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
                            </div>

                            {/* Down payment — optional, 0 = no DP */}
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Down Payment <span className="text-muted-foreground/50">(0 = no DP)</span></label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                                        <input value={instDown} onChange={e => setInstDown(e.target.value)}
                                            type="number" min="0" step="0.01"
                                            className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
                                    </div>
                                    <button onClick={() => setInstDown("0")}
                                        className="h-9 px-3 rounded-xl border border-border text-xs font-medium hover:border-primary/40 hover:bg-accent transition-colors whitespace-nowrap">
                                        No DP
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Financed amount: <span className="font-semibold text-foreground">{fmtMoney(Math.max(0, total - downN), currency)}</span>
                                </p>
                            </div>

                            {/* Terms (months) */}
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Terms (months)</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[3, 6, 9, 12, 18, 24, 30, 36].map(n => (
                                        <button key={n} type="button" onClick={() => setInstCount(String(n))}
                                            className={cn("h-9 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                                                instCount === String(n)
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-border text-foreground hover:border-primary/40 hover:bg-accent")}>
                                            {n}mo
                                        </button>
                                    ))}
                                </div>
                                {downN < total && parseInt(instCount) > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ≈ {fmtMoney(Math.round((total - downN) / parseInt(instCount) * 100) / 100, currency)}/month
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Notes <span className="text-muted-foreground/50">(optional)</span></label>
                                <input value={instNotes} onChange={e => setInstNotes(e.target.value)}
                                    placeholder="e.g. voucher, special terms…"
                                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" />
                            </div>
                        </div>
                    )}

                    {/* Cash numpad */}
                    {isCash && (
                        <div>
                            <div className="bg-muted/40 border border-border/85 rounded-xl px-4 py-3 mb-3 flex items-center justify-between gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Received</span>
                                    <span className="text-2xl font-black tabular-nums text-foreground mt-0.5">
                                        {currency}{(parseFloat(tender || "0")).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {tenderN >= total && total > 0 && (
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Change</p>
                                        <p className="text-2xl font-black tabular-nums text-green-600 dark:text-green-400 mt-0.5">{fmtMoney(change, currency)}</p>
                                    </div>
                                )}
                            </div>
                            
                            {total > 0 && (
                                <div className="flex gap-1.5 mb-3 flex-wrap">
                                    {[total, 100, 200, 500, 1000].filter((v, i) => i === 0 || v >= total).slice(0, 5).map((v, i) => (
                                        <button key={i} onClick={() => setTender(v.toFixed(2))}
                                            className="px-2.5 py-1 rounded-xl border border-border text-xs font-semibold hover:border-primary/40 hover:bg-accent transition-colors text-foreground">
                                            {i === 0 ? "Exact" : fmtMoney(Math.ceil(v / 100) * 100, currency)}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-3 gap-2">
                                {["7","8","9","4","5","6","1","2","3","00","0","⌫"].map(k => (
                                    <button key={k} onClick={() => k === "⌫" ? backspace() : append(k)}
                                        className={cn(
                                            "rounded-xl border h-12 transition-all active:scale-95 duration-100 flex items-center justify-center",
                                            k === "⌫" ? "text-amber-500 border-amber-200/50 bg-amber-500/5 hover:bg-amber-500/10 font-bold text-lg" : "border-border/60 bg-background text-foreground font-semibold hover:bg-muted text-lg"
                                        )}>
                                        {k}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-4 pb-5 pt-3 border-t border-border shrink-0">
                    {/* Server-side validation errors */}
                    {serverError && (
                        <div className="mb-3 flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-xs text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{serverError}</span>
                        </div>
                    )}
                    {isInstallment && !customer.trim() && (
                        <p className="text-xs text-destructive mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 shrink-0" />Customer name is required for installments.
                        </p>
                    )}
                    <Button className="w-full h-12 text-base font-bold gap-2" disabled={!canPay || loading}
                        onClick={() => onConfirm({
                            payment_method:           method,
                            payment_amount:           isCash ? tenderN : (isInstallment ? downN : total),
                            customer_name:            customer,
                            discount_percent:         disc,
                            promo_id:                 appliedPromo?.id ?? null,
                            ...(isInstallment ? {
                                installment_provider:       instProvider,
                                installment_reference:      instReference || undefined,
                                installment_customer_phone: instPhone || undefined,
                                installment_down_payment:   downN,
                                installments_count:         parseInt(instCount),
                                installment_notes:          instNotes || undefined,
                            } : {}),
                        })}>
                        {loading ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : (
                            isInstallment
                                ? <>
                                    <CalendarClock className="h-4 w-4" />
                                    Record {instProvider === "home_credit" ? "Home Credit" : instProvider === "skyro" ? "Skyro" : "Financing"}
                                    {downN > 0 ? ` · DP ${fmtMoney(downN, currency)}` : " · No DP"}
                                  </>
                                : <><Zap className="h-4 w-4" />Checkout {fmtMoney(total, currency)}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
