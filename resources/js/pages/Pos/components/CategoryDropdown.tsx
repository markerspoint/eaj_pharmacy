"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Category } from "../posTypes";

interface CategoryDropdownProps {
    categories: Category[];
    activeCat: number | null;
    onChange: (id: number | null) => void;
}

export function CategoryDropdown({ categories, activeCat, onChange }: CategoryDropdownProps) {
    const [open, setOpen] = useState(false);

    if (!categories.length) return null;

    const activeCategory = categories.find(c => c.id === activeCat);
    const triggerLabel = activeCategory ? activeCategory.name : "All categories";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "h-9 px-3 flex items-center justify-between gap-1.5 text-xs sm:text-sm bg-background border rounded-xl min-w-[130px] max-w-[170px] cursor-pointer transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary/40",
                        activeCat !== null ? "border-primary/60 text-foreground font-medium" : "border-border text-muted-foreground"
                    )}
                >
                    <span className="truncate flex-1">{triggerLabel}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1.5 max-h-[300px] overflow-y-auto rounded-xl shadow-lg border border-border bg-popover" align="start">
                <div className="flex flex-col gap-0.5">
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            setOpen(false);
                        }}
                        className={cn(
                            "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                            activeCat === null
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-foreground hover:bg-muted hover:text-accent-foreground"
                        )}
                    >
                        All categories
                    </button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                                onChange(c.id);
                                setOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate",
                                activeCat === c.id
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-foreground hover:bg-muted hover:text-accent-foreground"
                            )}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
