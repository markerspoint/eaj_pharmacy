import { cn } from "@/lib/utils";

interface ToggleProps {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
    return (
        <label className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
            checked ? "border-primary/40 bg-primary/5" : "border-border hover:bg-accent/50"
        )}>
            <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <div onClick={() => onChange(!checked)}
                className={cn("w-10 h-5 rounded-full transition-colors relative shrink-0",
                    checked ? "bg-primary" : "bg-muted")}>
                <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-5" : "translate-x-0.5")} />
            </div>
        </label>
    );
}
