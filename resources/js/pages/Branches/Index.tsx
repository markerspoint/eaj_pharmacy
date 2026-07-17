"use client";

import { usePage } from "@inertiajs/react";
import {
    Plus, Search, X, Edit2, Trash2,
    Users, Phone, MapPin, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/layouts/AdminLayout";
import { cn } from "@/lib/utils";

import { BranchDrawer } from "./components/BranchDrawer";
import { DeleteDialog } from "./components/DeleteDialog";
import { useBranches } from "./hooks/brancheshooks";
import type { PageProps } from "./types/branchestypes";
import { typeBadge, typeIcon } from "./utils/branchesutils";

export default function BranchesIndex() {
    const { branches, businessTypes, auth, flash } = usePage<PageProps>().props;

    const {
        search,
        setSearch,
        typeFilter,
        setTypeFilter,
        statusFilter,
        setStatusFilter,
        drawer,
        setDrawer,
        deleteTarget,
        setDeleteTarget,
        toast,
        setToast,
        filtered,
        activeCount,
        handleToggle,
        clearFilters,
    } = useBranches(branches, flash?.message);

    const canManage = auth?.user?.is_super_admin || auth?.user?.is_administrator;

    return (
        <AdminLayout>
            {toast && (
                <div className={cn(
                    "fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium",
                    toast.type === "success"
                        ? "bg-[#0b1a10] border-emerald-500/40 text-emerald-300"
                        : "bg-[#1a0b0b] border-red-500/40 text-red-300"
                )}>
                    <span>{toast.type === "success" ? "✓" : "✕"}</span>
                    <span>{toast.text}</span>
                    <button onClick={() => setToast(null)} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                </div>
            )}

            <div className="space-y-5 max-w-[1400px] mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Branches</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {branches.length} branch{branches.length !== 1 ? "es" : ""} · {activeCount} active
                        </p>
                    </div>
                    {canManage && (
                        <Button className="gap-2 h-9 font-semibold"
                            onClick={() => setDrawer({ mode: "create", branch: null })}>
                            <Plus className="h-4 w-4" /> Add Branch
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, code, or address…"
                                className="w-full h-9 pl-9 pr-9 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground" />
                            {search && (
                                <button onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                            className="h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground min-w-[160px]">
                            <option value="">All types</option>
                            {Object.entries(businessTypes).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground min-w-[130px]">
                            <option value="">All status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {(search || typeFilter || statusFilter) && (
                            <button onClick={clearFilters}
                                className="h-9 px-3 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted flex items-center gap-1.5 transition-colors">
                                <X className="h-3.5 w-3.5" /> Clear
                            </button>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {/* Summary cards — clickable to filter by type */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {Object.entries(businessTypes).map(([type, label]) => {
                        const count = branches.filter(b => b.business_type === type).length;
                        return (
                            <button key={type}
                                onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
                                className={cn("bg-card border rounded-xl p-4 text-left transition-all hover:shadow-sm",
                                    typeFilter === type ? "border-primary bg-primary/5" : "border-border")}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-lg">{typeIcon[type]}</span>
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize", typeBadge[type])}>
                                        {type}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold tabular-nums text-foreground">{count}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {["Branch", "Type", "Contact", "Features", "Users", "Status", ""].map((h, i) => (
                                        <th key={i} className={cn(
                                            "px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
                                            i === 0 ? "text-left" : i === 6 ? "text-right w-10" : "text-left",
                                            i === 2 ? "hidden md:table-cell" : "",
                                            i === 3 ? "hidden lg:table-cell" : "",
                                            i === 4 ? "hidden sm:table-cell" : "",
                                        )}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                            No branches found
                                        </td>
                                    </tr>
                                ) : filtered.map(b => {
                                    const activeFlags = Object.values(b.feature_flags).filter(Boolean).length;
                                    return (
                                        <tr key={b.id} className="hover:bg-muted/20 transition-colors group">

                                            {/* Name + Code */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0",
                                                        b.is_active ? "bg-primary/10" : "bg-muted"
                                                    )}>
                                                        {typeIcon[b.business_type]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-foreground truncate">{b.name}</p>
                                                            {!b.is_active && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                                                                    inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground font-mono tracking-wider">{b.code}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Business type */}
                                            <td className="px-4 py-3">
                                                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full capitalize", typeBadge[b.business_type])}>
                                                    {b.business_type}
                                                </span>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <div className="space-y-0.5 min-w-0">
                                                    {b.contact_person && (
                                                        <p className="text-xs text-foreground font-medium flex items-center gap-1.5 truncate">
                                                            <User className="h-3 w-3 text-muted-foreground shrink-0" />{b.contact_person}
                                                        </p>
                                                    )}
                                                    {b.phone && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3 shrink-0" />{b.phone}
                                                        </p>
                                                    )}
                                                    {b.address && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 max-w-[200px] truncate">
                                                            <MapPin className="h-3 w-3 shrink-0" />{b.address}
                                                        </p>
                                                    )}
                                                    {!b.contact_person && !b.phone && !b.address && (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Feature flags */}
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden w-16">
                                                        <div className="bg-primary h-full rounded-full transition-all"
                                                            style={{ width: `${(activeFlags / 5) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{activeFlags}/5</span>
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    {b.use_table_ordering  && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">tables</span>}
                                                    {b.use_variants        && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">variants</span>}
                                                    {b.use_expiry_tracking && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">expiry</span>}
                                                    {b.use_recipe_system   && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">recipes</span>}
                                                    {b.use_bundles         && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">bundles</span>}
                                                </div>
                                            </td>

                                            {/* Users */}
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span className="text-sm tabular-nums">{b.users_count}</span>
                                                </div>
                                            </td>

                                            {/* Status — clickable toggle */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => canManage && handleToggle(b)}
                                                    disabled={!canManage}
                                                    title={b.is_active ? "Click to deactivate" : "Click to activate"}
                                                    className={cn(
                                                        "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all",
                                                        b.is_active
                                                            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                                                        !canManage && "cursor-default"
                                                    )}>
                                                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                                                        b.is_active ? "bg-emerald-400" : "bg-muted-foreground/50")} />
                                                    {b.is_active ? "Active" : "Inactive"}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                {canManage && (
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setDrawer({ mode: "edit", branch: b })}
                                                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                            title="Edit">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => setDeleteTarget(b)}
                                                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                                                            title="Delete">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {drawer && (
                <BranchDrawer
                    mode={drawer.mode}
                    branch={drawer.branch}
                    businessTypes={businessTypes}
                    onClose={() => setDrawer(null)}
                />
            )}

            {deleteTarget && (
                <DeleteDialog branch={deleteTarget} onClose={() => setDeleteTarget(null)} />
            )}
        </AdminLayout>
    );
}
