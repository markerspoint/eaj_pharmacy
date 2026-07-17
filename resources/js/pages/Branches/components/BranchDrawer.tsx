import { X, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useBranchForm } from "../hooks/brancheshooks";
import type { Branch, FormMode } from "../types/branchestypes";
import { typeIcon } from "../utils/branchesutils";
import { Toggle } from "./Toggle";

interface BranchDrawerProps {
    mode: FormMode;
    branch: Branch | null;
    businessTypes: Record<string, string>;
    onClose: () => void;
}

export function BranchDrawer({ mode, branch, businessTypes, onClose }: BranchDrawerProps) {
    const {
        form,
        tab,
        setTab,
        loading,
        errors,
        setFieldValue,
        handleSubmit,
        flagCount,
    } = useBranchForm(mode, branch, onClose);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:w-[540px] bg-card border-l border-border flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div>
                        <p className="font-bold text-foreground">
                            {mode === "create" ? "Create Branch" : `Edit — ${branch?.name}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {mode === "create" ? "Add a new branch location" : "Update branch details and settings"}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border shrink-0">
                    {(["info", "flags"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors",
                                tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
                            {t === "info" ? "Branch Info" : (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    Feature Flags
                                    {flagCount > 0 && (
                                        <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                                            {flagCount}
                                        </span>
                                    )}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {tab === "info" ? (
                        <div className="space-y-4">

                            {/* Name + Code */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="field-label">Branch Name <span className="text-destructive">*</span></label>
                                    <Input value={form.name} onChange={e => setFieldValue("name", e.target.value)}
                                        placeholder="e.g. Main Branch"
                                        className={cn("h-9 mt-1", errors.name && "border-destructive")} />
                                    {errors.name && <p className="field-error">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="field-label">Code <span className="text-destructive">*</span></label>
                                    <Input value={form.code}
                                        onChange={e => setFieldValue("code", e.target.value.toUpperCase())}
                                        placeholder="ABC1" maxLength={20}
                                        className={cn("h-9 mt-1 font-mono uppercase tracking-widest", errors.code && "border-destructive")} />
                                    {errors.code && <p className="field-error">{errors.code}</p>}
                                </div>
                            </div>

                            {/* Business Type */}
                            <div>
                                <label className="field-label">Business Type <span className="text-destructive">*</span></label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {Object.entries(businessTypes).map(([val, label]) => (
                                        <button key={val} type="button" onClick={() => setFieldValue("business_type", val)}
                                            className={cn(
                                                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                                                form.business_type === val
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-border hover:border-primary/30 hover:bg-accent"
                                            )}>
                                            <span className="text-xl">{typeIcon[val]}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn("text-xs font-semibold",
                                                    form.business_type === val ? "text-primary" : "text-foreground"
                                                )}>{label}</p>
                                            </div>
                                            {form.business_type === val && (
                                                <CircleDot className="h-3.5 w-3.5 text-primary shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.business_type && <p className="field-error">{errors.business_type}</p>}
                            </div>

                            {/* Phone + Contact */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="field-label">Phone</label>
                                    <Input value={form.phone} onChange={e => setFieldValue("phone", e.target.value)}
                                        placeholder="+63 912 345 6789" className="h-9 mt-1" />
                                </div>
                                <div>
                                    <label className="field-label">Contact Person</label>
                                    <Input value={form.contact_person} onChange={e => setFieldValue("contact_person", e.target.value)}
                                        placeholder="Juan Dela Cruz" className="h-9 mt-1" />
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="field-label">Address</label>
                                <textarea value={form.address} onChange={e => setFieldValue("address", e.target.value)}
                                    rows={2} placeholder="Street, City, Province"
                                    className="w-full mt-1 text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground text-foreground" />
                            </div>

                            {/* Active */}
                            <Toggle checked={form.is_active} onChange={v => setFieldValue("is_active", v)}
                                label="Active" description="Inactive branches are hidden from operations" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground pb-1">
                                Flags are auto-set when you pick a business type but can be customized here.
                            </p>
                            <Toggle checked={form.use_table_ordering}  onChange={v => setFieldValue("use_table_ordering", v)}
                                label="Table Ordering"     description="Dine-in table management and kitchen orders" />
                            <Toggle checked={form.use_variants}        onChange={v => setFieldValue("use_variants", v)}
                                label="Product Variants"   description="Size / color / flavor variant support" />
                            <Toggle checked={form.use_expiry_tracking} onChange={v => setFieldValue("use_expiry_tracking", v)}
                                label="Expiry Tracking"    description="Track batch numbers and expiry dates on stock" />
                            <Toggle checked={form.use_recipe_system}   onChange={v => setFieldValue("use_recipe_system", v)}
                                label="Recipe / BOM"       description="Made-to-order products with ingredient recipes" />
                            <Toggle checked={form.use_bundles}         onChange={v => setFieldValue("use_bundles", v)}
                                label="Product Bundles"    description="Bundle multiple products into one sellable item" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-border p-4 flex gap-3">
                    <Button variant="outline" className="flex-1 h-10" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button className="flex-1 h-10 gap-2 font-semibold" onClick={handleSubmit} disabled={loading}>
                        {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />}
                        {mode === "create" ? "Create Branch" : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
