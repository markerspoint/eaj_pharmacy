import type { BranchForm } from "../types/branchestypes";

export const EMPTY_FORM: BranchForm = {
    name: "", code: "", address: "", phone: "", contact_person: "",
    business_type: "retail",
    use_table_ordering: false, use_variants: false,
    use_expiry_tracking: false, use_recipe_system: false,
    use_bundles: false, is_active: true,
};

export const typeBadge: Record<string, string> = {
    cafe:       "bg-purple-500/15 text-purple-400 border border-purple-500/20",
    restaurant: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    food_stall: "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20",
    bakery:     "bg-pink-500/15 text-pink-400 border border-pink-500/20",
    bar:        "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    retail:     "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    pharmacy:   "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    hardware:   "bg-stone-500/15 text-stone-400 border border-stone-500/20",
    salon:      "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20",
    laundry:    "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
    school:     "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
    warehouse:  "bg-slate-500/15 text-slate-400 border border-slate-500/20",
    mixed:      "bg-teal-500/15 text-teal-400 border border-teal-500/20",
};

export const typeIcon: Record<string, string> = {
    cafe:       "☕",
    restaurant: "🍽",
    food_stall: "🥘",
    bakery:     "🥐",
    bar:        "🍺",
    retail:     "🛒",
    pharmacy:   "💊",
    hardware:   "🔧",
    salon:      "✂️",
    laundry:    "👕",
    school:     "🎓",
    warehouse:  "🏭",
    mixed:      "🏪",
};

export const defaultFlags: Record<string, Partial<BranchForm>> = {
    cafe:       { use_table_ordering: false, use_variants: true,  use_expiry_tracking: false, use_recipe_system: true,  use_bundles: false },
    restaurant: { use_table_ordering: true,  use_variants: false, use_expiry_tracking: false, use_recipe_system: true,  use_bundles: false },
    food_stall: { use_table_ordering: false, use_variants: false, use_expiry_tracking: false, use_recipe_system: true,  use_bundles: false },
    bakery:     { use_table_ordering: false, use_variants: true,  use_expiry_tracking: true,  use_recipe_system: true,  use_bundles: true  },
    bar:        { use_table_ordering: true,  use_variants: true,  use_expiry_tracking: false, use_recipe_system: true,  use_bundles: true  },
    retail:     { use_table_ordering: false, use_variants: true,  use_expiry_tracking: true,  use_recipe_system: false, use_bundles: true  },
    pharmacy:   { use_table_ordering: false, use_variants: false, use_expiry_tracking: true,  use_recipe_system: false, use_bundles: false },
    hardware:   { use_table_ordering: false, use_variants: true,  use_expiry_tracking: false, use_recipe_system: false, use_bundles: true  },
    salon:      { use_table_ordering: false, use_variants: true,  use_expiry_tracking: false, use_recipe_system: false, use_bundles: true  },
    laundry:    { use_table_ordering: false, use_variants: true,  use_expiry_tracking: false, use_recipe_system: false, use_bundles: true  },
    school:     { use_table_ordering: false, use_variants: false, use_expiry_tracking: false, use_recipe_system: false, use_bundles: true  },
    warehouse:  { use_table_ordering: false, use_variants: true,  use_expiry_tracking: true,  use_recipe_system: false, use_bundles: false },
    mixed:      { use_table_ordering: true,  use_variants: true,  use_expiry_tracking: true,  use_recipe_system: true,  use_bundles: true  },
};
