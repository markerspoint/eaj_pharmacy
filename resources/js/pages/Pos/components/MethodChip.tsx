"use client";

import { Banknote, Smartphone, CreditCard, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface MethodChipProps {
    method: string;
}

export function MethodChip({ method }: MethodChipProps) {
    const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
        cash:   { label: "Cash",   color: "bg-green-50  text-green-700  dark:bg-green-900/20  dark:text-green-400",  icon: Banknote   },
        gcash:  { label: "GCash",  color: "bg-blue-50   text-blue-700   dark:bg-blue-900/20   dark:text-blue-400",   icon: Smartphone },
        card:   { label: "Card",   color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400", icon: CreditCard },
        others: { label: "Others", color: "bg-muted     text-muted-foreground",                                       icon: Tag        },
    };
    const m = map[method] ?? map.others;
    const Icon = m.icon;
    return (
        <span className={cn("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit", m.color)}>
            <Icon className="h-2.5 w-2.5" />{m.label}
        </span>
    );
}
