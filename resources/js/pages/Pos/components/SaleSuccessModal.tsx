"use client";

import { CalendarClock, CheckCircle2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReceiptTemplate, { fmtMoney, type ReceiptData } from "./ReceiptTemplate";

interface SaleSuccessModalProps {
    receipt: ReceiptData;
    currency: string;
    installmentPlanId?: number | null;
    onNewSale: () => void;
}

export function SaleSuccessModal({ receipt, currency, installmentPlanId, onNewSale }: SaleSuccessModalProps) {
    const isInstallment = receipt.payment_method === "installment";
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl flex flex-col max-h-[92vh]">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
                    <div className={cn("p-1.5 rounded-full", isInstallment ? "bg-primary/10" : "bg-green-100 dark:bg-green-900/40")}>
                        {isInstallment
                            ? <CalendarClock className="h-5 w-5 text-primary" />
                            : <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">
                            {isInstallment ? "Installment plan created" : "Sale completed"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{receipt.receipt_number}</p>
                    </div>
                </div>

                {/* Installment summary banner */}
                {isInstallment && installmentPlanId && (
                    <div className="mx-4 mt-4 p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" /> Installment Plan Active
                        </p>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-bold">{fmtMoney(receipt.total, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Down payment collected</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                                {fmtMoney(receipt.payment_amount, currency)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining balance</span>
                            <span className="font-bold text-foreground">
                                {fmtMoney(Math.max(0, receipt.total - receipt.payment_amount), currency)}
                            </span>
                        </div>
                        <a href={`/installments/${installmentPlanId}`}
                            className="mt-1 flex items-center justify-center gap-1.5 w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                            <CalendarClock className="h-3.5 w-3.5" /> View Installment Plan
                        </a>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-5">
                    <ReceiptTemplate sale={receipt} currency={currency} showActions={true} />
                </div>
                <div className="px-4 pb-5 pt-3 border-t border-border shrink-0">
                    <Button className="w-full h-11 font-bold gap-2" onClick={onNewSale}>
                        <ShoppingCart className="h-4 w-4" />New Sale
                    </Button>
                </div>
            </div>
        </div>
    );
}
