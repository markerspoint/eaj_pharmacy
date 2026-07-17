"use client";

import { X } from "lucide-react";
import { fmtMoney } from "./ReceiptTemplate";
import type { Product } from "../posTypes";

interface VariantPickerProps {
    product: Product;
    currency: string;
    onSelect: (id: number | null, name: string | null) => void;
    onClose: () => void;
}

export function VariantPicker({ product, currency, onSelect, onClose }: VariantPickerProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-border">
                    <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-foreground leading-snug">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Choose a variant</p>
                    </div>
                    <button onClick={onClose} className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                    <button
                        onClick={() => onSelect(null, null)}
                        disabled={(product.base_stock ?? product.stock) <= 0}
                        className="flex flex-col items-start gap-1 p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-background"
                    >
                        <span className="text-sm font-semibold text-foreground">Base</span>
                        <span className="text-xs text-muted-foreground">{fmtMoney(product.price, currency)}</span>
                    </button>
                    {product.variants.filter(v => v.is_available).map(v => {
                        const disabled = (v.stock ?? 0) <= 0 || !!v.is_expired;
                        const price = v.price ?? product.price + v.extra_price;

                        return (
                            <button
                                key={v.id}
                                onClick={() => onSelect(v.id, v.name)}
                                disabled={disabled}
                                className="flex flex-col items-start gap-1 p-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-background"
                            >
                                <span className="text-sm font-semibold text-foreground">{v.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {fmtMoney(price, currency)}{disabled ? " · unavailable" : ""}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
