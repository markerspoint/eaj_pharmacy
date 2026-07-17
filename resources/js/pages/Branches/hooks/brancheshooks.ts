import { router } from "@inertiajs/react";
import { useState, useMemo, useEffect } from "react";
import { routes } from "@/routes";
import type { Branch, BranchForm, FormMode } from "../types/branchestypes";
import { EMPTY_FORM, defaultFlags } from "../utils/branchesutils";

export function useBranches(branches: Branch[], flashMessage?: { type: string; text: string }) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [drawer, setDrawer] = useState<{ mode: FormMode; branch: Branch | null } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
    const [toast, setToast] = useState<{ type: string; text: string } | null>(flashMessage ?? null);

    const filtered = useMemo(() => {
        let list = branches;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(b =>
                b.name.toLowerCase().includes(q) ||
                b.code.toLowerCase().includes(q) ||
                (b.address ?? "").toLowerCase().includes(q)
            );
        }
        if (typeFilter)   list = list.filter(b => b.business_type === typeFilter);
        if (statusFilter) list = list.filter(b => statusFilter === "active" ? b.is_active : !b.is_active);
        return list;
    }, [branches, search, typeFilter, statusFilter]);

    const activeCount = useMemo(() => branches.filter(b => b.is_active).length, [branches]);

    const handleToggle = (b: Branch) => {
        router.patch(routes.branches.toggle(b.id), {}, { preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("");
        setStatusFilter("");
    };

    return {
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
    };
}

export function useBranchForm(mode: FormMode, branch: Branch | null, onClose: () => void) {
    const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
    const [tab, setTab] = useState<"info" | "flags">("info");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (mode === "edit" && branch) {
            setForm({
                name:                branch.name,
                code:                branch.code,
                address:             branch.address          ?? "",
                phone:               branch.phone            ?? "",
                contact_person:      branch.contact_person   ?? "",
                business_type:       branch.business_type,
                use_table_ordering:  branch.use_table_ordering,
                use_variants:        branch.use_variants,
                use_expiry_tracking: branch.use_expiry_tracking,
                use_recipe_system:   branch.use_recipe_system,
                use_bundles:         branch.use_bundles,
                is_active:           branch.is_active,
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setTab("info");
        setErrors({});
    }, [mode, branch]);

    const setFieldValue = <K extends keyof BranchForm>(k: K, v: BranchForm[K]) => {
        setForm(f => {
            const next = { ...f, [k]: v };
            if (k === "business_type" && defaultFlags[v as string]) {
                return { ...next, ...defaultFlags[v as string] };
            }
            return next;
        });
        setErrors(e => ({ ...e, [k]: "" }));
    };

    const handleSubmit = () => {
        setLoading(true);
        setErrors({});
        const payload = { ...form };
        const isCreate = mode === "create";
        const url = isCreate ? routes.branches.store() : routes.branches.update(branch!.id);

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setLoading(false);
                onClose();
            },
            onError: (e: Record<string, string>) => {
                setErrors(e);
                setLoading(false);
                setTab("info");
            },
        };

        if (isCreate) {
            router.post(url, payload, options);
        } else {
            router.patch(url, payload, options);
        }
    };

    const flagCount = [
        form.use_table_ordering,
        form.use_variants,
        form.use_expiry_tracking,
        form.use_recipe_system,
        form.use_bundles,
    ].filter(Boolean).length;

    return {
        form,
        tab,
        setTab,
        loading,
        errors,
        setFieldValue,
        handleSubmit,
        flagCount,
    };
}

export function useBranchDelete(branch: Branch, onClose: () => void) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = () => {
        setLoading(true);
        setError("");
        router.delete(routes.branches.destroy(branch.id), {
            data: { reason },
            preserveScroll: true,
            onSuccess: () => {
                setLoading(false);
                onClose();
            },
            onError: e => {
                setError(Object.values(e)[0] as string);
                setLoading(false);
            },
        });
    };

    return {
        reason,
        setReason,
        loading,
        error,
        handleDelete,
    };
}
