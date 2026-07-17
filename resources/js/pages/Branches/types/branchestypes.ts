export interface Branch {
    id: number;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    contact_person: string | null;
    is_active: boolean;
    business_type: string;
    business_type_label: string;
    feature_flags: Record<string, boolean>;
    use_table_ordering: boolean;
    use_variants: boolean;
    use_expiry_tracking: boolean;
    use_recipe_system: boolean;
    use_bundles: boolean;
    users_count: number;
    product_stocks_count: number;
    created_at: string;
}

export interface PageProps {
    branches:      Branch[];
    businessTypes: Record<string, string>;
    auth:          { user: { is_super_admin: boolean; is_administrator: boolean } | null };
    flash:         { message?: { type: string; text: string } };
    [key: string]: unknown;
}

export type FormMode = "create" | "edit";

export interface BranchForm {
    name: string; code: string; address: string; phone: string;
    contact_person: string; business_type: string;
    use_table_ordering: boolean; use_variants: boolean;
    use_expiry_tracking: boolean; use_recipe_system: boolean;
    use_bundles: boolean; is_active: boolean;
}
