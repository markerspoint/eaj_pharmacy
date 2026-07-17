"use client";
import { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import AdminLayout from "@/layouts/AdminLayout";
import ReceiptTemplate, { fmtMoney, type ReceiptData } from "./components/ReceiptTemplate";
import { CategoryDropdown } from "./components/CategoryDropdown";
import { VariantPicker } from "./components/VariantPicker";
import { PaymentModal } from "./components/PaymentModal";
import { SaleSuccessModal } from "./components/SaleSuccessModal";
import { QueuedOrderModal } from "./components/QueuedOrderModal";
import { OpenSessionModal } from "./components/OpenSessionModal";
import { CartPanel } from "./components/CartPanel";
import { FastCashierLayout } from "./components/FastCashierLayout";
import { PendingPaymentModal } from "./components/PendingPaymentModal";
import { QRCodeSVG } from "qrcode.react";
import { routes } from "@/routes";
import { cn } from "@/lib/utils";
import {
    Search, X, Plus, Minus, Trash2, ShoppingCart, Tag,
    CreditCard, Banknote, Smartphone, CheckCircle2,
    AlertTriangle, Package, History, ScanLine, Printer, QrCode,
    RefreshCw, Zap, User, ChevronDown, Wallet, CalendarClock, Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Product, CartItem, Category, TableOrder, DiningTable, ActivePromo, QueuedOrder } from "./posTypes";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session  { id: number; opening_cash: number; opened_at: string; status: string; }
interface Branch   { id: number; name: string; business_type: string; feature_flags: Record<string, boolean>; }
interface PageProps {
    auth: { user: { fname: string; lname: string; role_label: string; is_cashier: boolean; cashier_type?: string; can_collect_payments?: boolean } | null };
    settings: {
        allow_discount: boolean; max_discount_percent: number;
        default_payment: string; vat_enabled: boolean;
        vat_rate: number; vat_inclusive: boolean; require_cash_session: boolean;
        enable_installments: boolean;
        hide_product_names_on_receipt: boolean;
    } | null;
    app: { currency: string };
    products: Product[];
    categories: Category[];
    session: Session | null;
    branch: Branch | null;
    open_table_orders: TableOrder[];
    dining_tables: DiningTable[];
    preferred_layout: string;
    cashier_type?: string;
    can_collect_payments?: boolean;
    pending_orders?: QueuedOrder[];
    promos: ActivePromo[];
    [key: string]: unknown;
}
type PayMethod   = "cash" | "gcash" | "card" | "others" | "installment";
type LayoutMode  = "grid" | "tablet" | "grocery" | "restaurant" | "cafe" | "salon" | "kiosk" | "mobile" | "order_only" | "fast_cashier";

const METHODS: { value: PayMethod; label: string; icon: React.ElementType }[] = [
    { value: "cash",        label: "Cash",        icon: Banknote    },
    { value: "gcash",       label: "GCash",       icon: Smartphone  },
    { value: "card",        label: "Card",        icon: CreditCard  },
    { value: "others",      label: "Others",      icon: Tag         },
    { value: "installment", label: "Installment", icon: CalendarClock },
];

// ─── Lazy-loaded layout chunks (each downloads only when that layout is used) ─
const GridLayout       = lazy(() => import("./layouts/GridLayout"));
const TabletLayout     = lazy(() => import("./layouts/TabletLayout"));
const GroceryLayout    = lazy(() => import("./layouts/GroceryLayout"));
const CafeLayout       = lazy(() => import("./layouts/CafeLayout"));
const RestaurantLayout = lazy(() => import("./layouts/RestaurantLayout"));
const SalonLayout      = lazy(() => import("./layouts/SalonLayout"));
const KioskLayout      = lazy(() => import("./layouts/KioskLayout"));
const MobileLayout     = lazy(() => import("./layouts/MobileLayout"));

function LayoutSpinner() {
    return (
        <div className="flex items-center justify-center h-full">
            <span className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
    );
}

// ─── Main POS component ───────────────────────────────────────────────────────
export default function PosIndex() {
    const { props }   = usePage<PageProps>();
    const { products, categories, session, branch, settings, app, open_table_orders, dining_tables } = props;
    const promos      = (props.promos as ActivePromo[]) ?? [];
    const user        = props.auth?.user;
    const currency    = app?.currency ?? "₱";
    const layout      = (props.preferred_layout ?? "grid") as LayoutMode;
    const pendingOrders = (props.pending_orders as QueuedOrder[]) ?? [];
    const isOrderTaker = (props.cashier_type ?? user?.cashier_type) === "order_taker";
    const canCollectPayments = props.can_collect_payments ?? user?.can_collect_payments ?? !isOrderTaker;
    const isOrderOnly = layout === "order_only" || !canCollectPayments;

    const [cart,               setCart]               = useState<CartItem[]>([]);
    const [search,             setSearch]             = useState("");
    const [activeCat,          setActiveCat]          = useState<number | null>(null);
    const [showPayment,        setShowPayment]        = useState(false);
    const [showPendingPayments,setShowPendingPayments]= useState(false);
    const [showOpenSession,    setShowOpenSession]    = useState(false);
    const [receipt,            setReceipt]            = useState<ReceiptData | null>(null);
    const [queuedOrder,        setQueuedOrder]        = useState<QueuedOrder | null>(null);
    const [activeQueuedOrder,  setActiveQueuedOrder]  = useState<QueuedOrder | null>(null);
    const [installmentPlanId,  setInstallmentPlanId]  = useState<number | null>(null);
    const [loading,            setLoading]            = useState(false);
    const [error,              setError]              = useState<string | null>(null);
    const [variantFor,         setVariantFor]         = useState<Product | null>(null);
    const [activeTableOrderId, setActiveTableOrderId] = useState<number | null>(null);
    const [pendingTableId,     setPendingTableId]     = useState<number | null>(null);

    const searchRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => { searchRef.current?.focus(); }, []);

    // When a new table order is created, auto-select it once open_table_orders reloads
    useEffect(() => {
        if (pendingTableId === null) return;
        const newOrder = open_table_orders.find(o => o.table_id === pendingTableId);
        if (newOrder) {
            setActiveTableOrderId(newOrder.id);
            setPendingTableId(null);
        }
    }, [open_table_orders, pendingTableId]);

    const handleStartTableOrder = useCallback((tableId: number, covers: number) => {
        setPendingTableId(tableId);
        router.post(routes.tableOrders.store(), { table_id: tableId, covers }, {
            preserveScroll: true,
            only: ['open_table_orders'],
        });
    }, []);

    // Auto-refocus the search/barcode input after any transient action
    const refocus = useCallback((delay = 0) => {
        setTimeout(() => searchRef.current?.focus(), delay);
    }, []);

    const filtered = useMemo(() => {
        let list = products.filter(p => p.product_type !== 'ingredient');
        if (activeCat)      list = list.filter(p => p.category?.id === activeCat);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q));
        }
        return list;
    }, [products, activeCat, search]);

    const fastSearchSuggestions = useMemo(() => {
        if (!search.trim()) return [];
        return filtered.slice(0, 10);
    }, [filtered, search]);

    const subtotal  = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
    const itemCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

    const requireCustomerName = branch?.business_type === "salon";

    const addItem = useCallback((product: Product, variantId: number | null = null, variantName: string | null = null) => {
        const variant   = variantId ? product.variants.find(v => v.id === variantId) : null;
        const extra     = variant?.extra_price ?? 0;
        const price     = variant?.price ?? product.price + extra;
        const key       = `${product.id}-${variantId ?? "base"}`;
        const stockLim  = (product.product_type === 'bundle' || product.product_type === 'made_to_order')
            ? 999
            : (variant ? (variant.stock ?? 0) : (product.base_stock ?? product.stock));
        if (stockLim <= 0) return;
        setCart(prev => {
            const ex = prev.find(i => i.key === key);
            if (ex) {
                if (ex.qty >= stockLim) return prev;
                return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { key, product_id: product.id, variant_id: variantId, name: product.name, variant_name: variantName, price, qty: 1, stock: stockLim, product_type: product.product_type, bundle_items: product.bundle_items ?? null, recipe_items: product.recipe_items ?? null }];
        });
    }, []);

    const handleProductClick = useCallback((p: Product) => {
        const isBundleMTO = p.product_type === 'bundle' || p.product_type === 'made_to_order';
        if (!isBundleMTO && p.stock <= 0) return;
        if (p.is_expired) { setError("This product is expired and cannot be sold."); return; }
        if (p.has_variants && p.variants.filter(v => v.is_available).length > 0) {
            setVariantFor(p);
            return;
        }
        addItem(p);
        setSearch("");
        refocus();
    }, [addItem, refocus]);

    const normalizePendingPaymentScan = useCallback((value: string) => {
        const raw = value.trim();
        if (!raw) return "";

        try {
            const parsed = new URL(raw);
            const pathToken = parsed.pathname.split("/").filter(Boolean).pop();
            return (parsed.searchParams.get("token") || parsed.searchParams.get("qr") || pathToken || raw)
                .trim()
                .toUpperCase();
        } catch {
            const maybePathToken = raw.split(/[/?#]/).filter(Boolean).pop() ?? raw;
            return maybePathToken.trim().toUpperCase();
        }
    }, []);

    const looksLikePendingPaymentCode = useCallback((value: string) => {
        const code = normalizePendingPaymentScan(value);
        return /^[A-Z0-9]{8,20}$/.test(code) || /^Q\d{6}-\d{4,}$/.test(code);
    }, [normalizePendingPaymentScan]);

    const loadQueuedOrder = useCallback(async (token: string) => {
        const lookup = normalizePendingPaymentScan(token);
        if (!lookup) return false;
        try {
            const res = await fetch(`/pos/queued-orders/${encodeURIComponent(lookup)}`, {
                headers: { "Accept": "application/json" },
            });
            if (!res.ok) return false;
            const data = await res.json();
            const order = data.order as QueuedOrder;
            setActiveQueuedOrder(order);
            setCart(order.items.map(item => ({
                key: `${item.product_id}-${item.variant_id ?? "base"}`,
                product_id: item.product_id,
                variant_id: item.variant_id,
                name: item.product_name,
                variant_name: item.variant_name,
                price: item.price,
                qty: item.quantity,
                stock: 999,
                product_type: "standard",
                bundle_items: null,
                recipe_items: null,
            })));
            setError(null);
            setSearch("");
            setShowPendingPayments(false);
            refocus(50);
            return true;
        } catch {
            return false;
        }
    }, [normalizePendingPaymentScan, refocus]);

    const selectPendingOrder = useCallback((order: QueuedOrder) => {
        void loadQueuedOrder(order.qr_token);
    }, [loadQueuedOrder]);

    const deletePendingOrder = useCallback((order: QueuedOrder) => {
        router.delete(`/pos/queued-orders/${order.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (activeQueuedOrder?.id === order.id) {
                    setActiveQueuedOrder(null);
                    setCart([]);
                }
                router.reload({ only: ["pending_orders"] });
                refocus(50);
            },
            onError: errors => {
                setError(Object.values(errors)[0] as string ?? "Unable to remove pending order.");
            },
        });
    }, [activeQueuedOrder, refocus]);

    // Combined search + instant barcode: if the current value exactly matches a barcode, add it
    const handleSearchOrScan = useCallback((value: string) => {
        setSearch(value);
        const code = value.trim();
        if (!code) return;
        const exact = products.find(p => (p.barcode ?? "").trim() === code);
        if (exact) {
            handleProductClick(exact);
            setSearch("");
            return;
        }
        if (canCollectPayments && looksLikePendingPaymentCode(code)) void loadQueuedOrder(code);
    }, [products, handleProductClick, loadQueuedOrder, canCollectPayments, looksLikePendingPaymentCode]);

    // Enter key: 1) exact barcode match, 2) exact name match, 3) single filtered result
    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const code = search.trim();
        if (!code) return;

        // Priority 1: exact barcode
        const byBarcode = products.find(p => (p.barcode ?? "").trim() === code);
        if (byBarcode) { handleProductClick(byBarcode); setSearch(""); return; }

        // Priority 2: exact product name (case-insensitive)
        const lower    = code.toLowerCase();
        const byName   = products.find(p => p.name.toLowerCase() === lower);
        if (byName)  { handleProductClick(byName); setSearch(""); return; }

        // Priority 3: only one result in the filtered list → treat as unambiguous
        if (filtered.length === 1) { handleProductClick(filtered[0]); setSearch(""); }
        else if (canCollectPayments && looksLikePendingPaymentCode(code)) void loadQueuedOrder(code);
    }, [search, products, filtered, handleProductClick, loadQueuedOrder, canCollectPayments, looksLikePendingPaymentCode]);

    const updateQty    = (key: string, delta: number) =>
        setCart(prev => prev.flatMap(i => {
            if (i.key !== key) return [i];
            const nq = i.qty + delta;
            if (nq <= 0) return [];
            if (nq > i.stock) return [i];
            return [{ ...i, qty: nq }];
        }));

    const removeItem = (key: string) => setCart(prev => prev.filter(i => i.key !== key));
    const clearCart  = () => setCart([]);

    const handleQueue = () => {
        if (!cart.length) return;
        setLoading(true); setError(null);
        router.post(routes.pos.queue(), {
            items: cart.map(i => ({ id: i.product_id, qty: i.qty, variant_id: i.variant_id })),
        }, {
            preserveScroll: true,
            onSuccess: page => {
                const flash = (page.props as any).flash ?? {};
                if (!flash.queued_order) {
                    const pageErrors = (page.props as any).errors ?? {};
                    const firstError = Object.values(pageErrors)[0] as string | undefined;
                    setError(pageErrors.error ?? firstError ?? "Unable to print QR ticket.");
                    setLoading(false);
                    return;
                }
                setQueuedOrder(flash.queued_order as QueuedOrder);
                setActiveQueuedOrder(null);
                setCart([]);
                setLoading(false);
            },
            onError: errors => {
                setError(Object.values(errors)[0] as string ?? "Unable to print QR ticket.");
                setLoading(false);
            },
        });
    };

    const handleConfirm = (payData: {
        payment_method: PayMethod; payment_amount: number; customer_name: string;
        discount_percent: number; promo_id: number | null;
        installment_provider?: string; installment_reference?: string;
        installment_customer_phone?: string; installment_down_payment?: number;
        installments_count?: number; installment_notes?: string;
    }) => {
        if (!cart.length) return;
        setLoading(true); setError(null);
        router.post(routes.pos.store(), {
            items:            cart.map(i => ({ id: i.product_id, qty: i.qty, variant_id: i.variant_id })),
            payment_method:   payData.payment_method,
            payment_amount:   payData.payment_amount,
            customer_name:    payData.customer_name || activeQueuedOrder?.customer_name || null,
            discount_percent: payData.discount_percent,
            promo_id:         payData.promo_id ?? null,
            cash_session_id:  session?.id ?? null,
            table_order_id:   activeTableOrderId ?? null,
            queued_order_id:  activeQueuedOrder?.id ?? null,
            // Financing/installment fields (sent only when method = installment)
            installment_provider:       payData.installment_provider ?? null,
            installment_reference:      payData.installment_reference ?? null,
            installment_customer_phone: payData.installment_customer_phone ?? null,
            installment_down_payment:   payData.installment_down_payment ?? null,
            installments_count:         payData.installments_count ?? null,
            installment_notes:          payData.installment_notes ?? null,
        }, {
            preserveScroll: true,
            onSuccess: page => {
                const flash = (page.props as any).flash ?? {};
                if (!flash.pos_result) {
                    setError(flash.errors?.error ?? "Checkout failed — please try again.");
                    setLoading(false);
                    return;
                }
                const r    = flash.pos_result;
                // Use server-computed values — avoids float drift between UI and DB
                const disc = r.discount_amount ?? 0;
                const pd   = r.promo_discount   ?? 0;
                const activeOrder = activeTableOrderId
                    ? open_table_orders.find(o => o.id === activeTableOrderId)
                    : null;
                setInstallmentPlanId(r.installment_plan_id ?? null);
                setReceipt({
                    receipt_number: r.receipt_number ?? "—",
                    status: "completed",
                    payment_method: payData.payment_method,
                    payment_amount: payData.payment_amount,
                    change_amount:  r.change ?? 0,
                    discount_amount: disc + pd,
                    total:           r.total,
                    customer_name:   payData.customer_name || null,
                    notes: [payData.discount_percent > 0 ? `Discount ${payData.discount_percent}%` : null, r.promo_name ? `Promo: ${r.promo_name}` : null].filter(Boolean).join(' | ') || null,
                    created_at:      new Date().toISOString(),
                    cashier:         user ? `${user.fname} ${user.lname}` : "—",
                    order_created_by: activeQueuedOrder?.listed_by ?? (user ? `${user.fname} ${user.lname}` : "—"),
                    payment_received_by: user ? `${user.fname} ${user.lname}` : "—",
                    branch_name:     branch?.name,
                    table_label:     activeOrder?.label ?? null,
                    business_type:   branch?.business_type,
                    hide_product_names: r.hide_product_names ?? settings?.hide_product_names_on_receipt ?? false,
                    items:           cart.map(i => ({ product_name: i.name, variant_name: i.variant_name, quantity: i.qty, price: i.price })),
                });
                setShowPayment(false);
                setActiveTableOrderId(null);
                setActiveQueuedOrder(null);
                setCart([]);
                setLoading(false);
            },
            onError: errors => {
                setError(Object.values(errors)[0] as string ?? "Transaction failed.");
                setLoading(false);
            },
        });
    };

    // Keyboard shortcuts — F2 and F5 both focus combined search/barcode field
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === "F2" || e.key === "F5") { e.preventDefault(); searchRef.current?.focus(); }
            if (e.key === "F9" && cart.length)    { e.preventDefault(); canCollectPayments ? startCharge() : handleQueue(); }
            if (e.key === "Escape")               { setShowPayment(false); setShowPendingPayments(false); setShowOpenSession(false); setVariantFor(null); }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [cart, canCollectPayments, handleQueue]);

    // ── Combined search/barcode input ─────────────────────────────────────────
    const searchInput = (
        <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
                ref={searchRef}
                value={search}
                onChange={e => handleSearchOrScan(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search or scan barcode… (F2)"
                className="w-full h-9 pl-9 pr-8 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                // Suppress browser floating toolbars (Translate / Clipboard / Web Search)
                // that appear on Android Chrome when text is entered via OTG barcode scanner
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-gramm="false"
            />
            {search
                ? <button onClick={() => { setSearch(""); refocus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                : <ScanLine className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />}
        </div>
    );

    const pendingPaymentButton = canCollectPayments ? (
        <button
            type="button"
            onClick={() => setShowPendingPayments(true)}
            className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Pending payments"
        >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Pending</span>
            {pendingOrders.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-black leading-4 text-primary-foreground">
                    {pendingOrders.length}
                </span>
            )}
        </button>
    ) : null;

    // ── Session guard ─────────────────────────────────────────────────────────
    const sessionRequired = settings?.require_cash_session ?? true;
    const sessionBlocked  = canCollectPayments && sessionRequired && !session;
    const startCharge = () => {
        if (!canCollectPayments) {
            setError("Order takers can only send orders to Pending Payment. A counter cashier must collect payment.");
            return;
        }
        if (sessionBlocked) {
            setError("Start a cash session before checkout.");
            setShowOpenSession(true);
            return;
        }
        setError(null);
        setShowPayment(true);
    };

    // ── No-session overlay — shown on top of any layout ───────────────────────
    const noSessionOverlay = false && sessionBlocked ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card shadow-2xl max-w-sm w-full mx-4 text-center">
                <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <p className="font-bold text-foreground text-lg">No Open Cash Session</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        You must open a cash session before you can process sales.
                    </p>
                </div>
                <a
                    href="/cash-sessions"
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                    <Wallet className="h-4 w-4" />
                    Go to Cash Sessions
                </a>
            </div>
        </div>
    ) : null;

    // ── Kiosk: truly full-screen (no layout wrapper at all) ──────────────────
    if (layout === "kiosk") {
        return (
            <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground relative">
                {noSessionOverlay}
                {/* Kiosk header */}
                <div className="shrink-0 flex items-center gap-3 bg-primary px-5 py-3.5">
                    <span className="font-black text-primary-foreground text-xl tracking-tight shrink-0">
                        {branch?.name ?? "POS"}
                    </span>
                    {/* Kiosk search — white background for contrast on primary header */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            ref={searchRef}
                            value={search}
                            onChange={e => handleSearchOrScan(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search or scan… (F2)"
                            className="w-full h-10 pl-9 pr-8 text-sm bg-white dark:bg-background border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-muted-foreground shadow-sm"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            data-gramm="false"
                        />
                        {search
                            ? <button onClick={() => { setSearch(""); refocus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                            : <ScanLine className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />}
                    </div>
                    <CategoryDropdown categories={categories} activeCat={activeCat} onChange={setActiveCat} />
                    <button onClick={() => window.location.reload()}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-primary-foreground transition-colors shrink-0">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
                {/* Kiosk body */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Suspense fallback={<LayoutSpinner />}>
                        <KioskLayout filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick}
                            onCharge={startCharge}
                            subtotal={subtotal} itemCount={itemCount} onClear={clearCart} />
                    </Suspense>
                </div>

                {variantFor && (
                    <VariantPicker product={variantFor} currency={currency}
                        onSelect={(vid, vname) => { addItem(variantFor, vid, vname); setVariantFor(null); refocus(50); }}
                        onClose={() => { setVariantFor(null); refocus(50); }} />
                )}
                {showPayment && (
                    <PaymentModal subtotal={subtotal} settings={settings} currency={currency}
                        customerNameRequired={requireCustomerName} promos={promos} cart={cart}
                        onConfirm={handleConfirm}
                        onClose={() => { setShowPayment(false); setError(null); refocus(50); }}
                        loading={loading} serverError={error} />
                )}
                {showOpenSession && (
                    <OpenSessionModal currency={currency} onClose={() => { setShowOpenSession(false); refocus(50); }} />
                )}
                {receipt && <SaleSuccessModal receipt={receipt} currency={currency} installmentPlanId={installmentPlanId} onNewSale={() => { setReceipt(null); setInstallmentPlanId(null); refocus(100); }} />}
                {queuedOrder && <QueuedOrderModal order={queuedOrder} currency={currency} onClose={() => { setQueuedOrder(null); refocus(100); }} />}
            </div>
        );
    }

    // ── Mobile: full AdminLayout with sidebar
    // Use dvh (dynamic viewport height) so the cart bar is never hidden behind browser chrome.
    // Falls back gracefully to 100vh on older browsers.
    if (layout === "mobile") {
        return (
            <AdminLayout>
                <div className="relative flex flex-col overflow-hidden -m-6"
                    style={{ height: 'calc(100dvh - 4rem)' }}>
                    {noSessionOverlay}
                    <div className="shrink-0 flex items-center gap-2 border-b border-border bg-card px-4 py-2">
                        {searchInput}
                        <a href={routes.sales.history()}
                            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                            <History className="h-3.5 w-3.5" />
                        </a>
                        {pendingPaymentButton}
                        {sessionBlocked && (
                            <button
                                type="button"
                                onClick={() => setShowOpenSession(true)}
                                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0"
                            >
                                <Unlock className="h-3.5 w-3.5" />
                                <span className="hidden sm:block">Start Session</span>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <Suspense fallback={<LayoutSpinner />}>
                            <MobileLayout filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick}
                                onCharge={startCharge} onQueue={handleQueue}
                                subtotal={subtotal} itemCount={itemCount} onClear={clearCart}
                                onUpdateQty={updateQty} onRemove={removeItem}
                                orderOnly={isOrderOnly} canCharge={canCollectPayments} />
                        </Suspense>
                    </div>
                </div>

                {variantFor && (
                    <VariantPicker product={variantFor} currency={currency}
                        onSelect={(vid, vname) => { addItem(variantFor, vid, vname); setVariantFor(null); refocus(50); }}
                        onClose={() => { setVariantFor(null); refocus(50); }} />
                )}
                {showPayment && (
                    <PaymentModal subtotal={subtotal} settings={settings} currency={currency}
                        customerNameRequired={requireCustomerName} promos={promos} cart={cart}
                        onConfirm={handleConfirm}
                        onClose={() => { setShowPayment(false); setError(null); refocus(50); }}
                        loading={loading} serverError={error} />
                )}
                {showOpenSession && (
                    <OpenSessionModal currency={currency} onClose={() => { setShowOpenSession(false); refocus(50); }} />
                )}
                {showPendingPayments && (
                        <PendingPaymentModal
                            orders={pendingOrders}
                            currency={currency}
                            activeOrderId={activeQueuedOrder?.id ?? null}
                            onSelect={selectPendingOrder}
                            onDelete={deletePendingOrder}
                            onClose={() => { setShowPendingPayments(false); refocus(50); }}
                        />
                    )}
                    {receipt && <SaleSuccessModal receipt={receipt} currency={currency} installmentPlanId={installmentPlanId} onNewSale={() => { setReceipt(null); setInstallmentPlanId(null); refocus(100); }} />}
                {queuedOrder && <QueuedOrderModal order={queuedOrder} currency={currency} onClose={() => { setQueuedOrder(null); refocus(100); }} />}
            </AdminLayout>
        );
    }

    // ── Standard layouts ──────────────────────────────────────────────────────
    if (layout === "fast_cashier") {
        return (
            <AdminLayout>
                <div className={cn(
                    "relative flex flex-col overflow-hidden",
                    user?.is_cashier
                        ? "h-[calc(100dvh-7rem)]"
                        : "h-[calc(100dvh-4rem)] -m-6"
                )}>
                    {noSessionOverlay}
                    <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-card sm:px-4">
                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0",
                            isOrderOnly
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : session ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", isOrderOnly ? "bg-emerald-500" : session ? "bg-green-500" : "bg-amber-500")} />
                            {isOrderOnly ? "Order taker" : session ? "Fast cashier" : "No session"}
                        </div>
                        <div className="relative order-last w-full flex-[1_1_420px] sm:order-none sm:min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                ref={searchRef}
                                value={search}
                                onChange={e => handleSearchOrScan(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search or scan product barcode... (F2)"
                                className="w-full h-10 pl-9 pr-8 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                data-gramm="false"
                            />
                            {search
                                ? <button onClick={() => { setSearch(""); refocus(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                                : <ScanLine className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />}
                            {search.trim() && (
                                <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
                                    {fastSearchSuggestions.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">No matching products</div>
                                    ) : (
                                        <div className="max-h-[min(60dvh,420px)] overflow-y-auto p-1.5">
                                            {fastSearchSuggestions.map(product => {
                                                const isBundleMTO = product.product_type === "bundle" || product.product_type === "made_to_order";
                                                const outStock = !isBundleMTO && product.stock <= 0;
                                                const inCart = cart.find(item => item.product_id === product.id);

                                                return (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        disabled={outStock}
                                                        onClick={() => handleProductClick(product)}
                                                        className={cn(
                                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                                            outStock ? "cursor-not-allowed opacity-45" : "hover:bg-muted",
                                                        )}
                                                    >
                                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-black text-foreground">{product.name}</p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {product.category?.name ?? "Uncategorized"} - {isBundleMTO ? product.product_type.replace("_", " ") : `${product.stock} stock`}
                                                            </p>
                                                        </div>
                                                        {inCart && (
                                                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">
                                                                x{inCart.qty}
                                                            </span>
                                                        )}
                                                        <p className="w-24 shrink-0 text-right text-sm font-black tabular-nums text-primary">{fmtMoney(product.price, currency)}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="shrink-0">
                            <CategoryDropdown categories={categories} activeCat={activeCat} onChange={setActiveCat} />
                        </div>
                        <div className="flex-1" />
                        <a href={routes.sales.history()}
                            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <History className="h-3.5 w-3.5" /><span className="hidden sm:block">History</span>
                        </a>
                        {pendingPaymentButton}
                        {sessionBlocked && (
                            <button type="button" onClick={() => setShowOpenSession(true)}
                                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors">
                                <Unlock className="h-3.5 w-3.5" />
                                <span className="hidden sm:block">Start Session</span>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <FastCashierLayout
                            cart={cart}
                            subtotal={subtotal}
                            itemCount={itemCount}
                            currency={currency}
                            settings={settings}
                            error={error}
                            loading={loading}
                            canCollectPayments={canCollectPayments}
                            sessionBlocked={sessionBlocked}
                            onUpdateQty={updateQty}
                            onRemove={removeItem}
                            onClear={clearCart}
                            onQueue={handleQueue}
                            onStartSession={() => setShowOpenSession(true)}
                            onCheckout={data => handleConfirm({
                                payment_method: data.payment_method,
                                payment_amount: data.payment_amount,
                                customer_name: data.customer_name,
                                discount_percent: data.discount_percent,
                                promo_id: null,
                            })}
                        />
                    </div>
                </div>

                {variantFor && (
                    <VariantPicker product={variantFor} currency={currency}
                        onSelect={(vid, vname) => { addItem(variantFor, vid, vname); setVariantFor(null); refocus(50); }}
                        onClose={() => { setVariantFor(null); refocus(50); }} />
                )}
                {showOpenSession && (
                    <OpenSessionModal currency={currency} onClose={() => { setShowOpenSession(false); refocus(50); }} />
                )}
                {showPendingPayments && (
                    <PendingPaymentModal
                        orders={pendingOrders}
                        currency={currency}
                        activeOrderId={activeQueuedOrder?.id ?? null}
                        onSelect={selectPendingOrder}
                        onDelete={deletePendingOrder}
                        onClose={() => { setShowPendingPayments(false); refocus(50); }}
                    />
                )}
                {receipt && <SaleSuccessModal receipt={receipt} currency={currency} installmentPlanId={installmentPlanId} onNewSale={() => { setReceipt(null); setInstallmentPlanId(null); refocus(100); }} />}
                {queuedOrder && <QueuedOrderModal order={queuedOrder} currency={currency} onClose={() => { setQueuedOrder(null); refocus(100); }} />}
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* CashierLayout (bottom-nav): header=3rem + nav=4rem = 7rem chrome, no padding */}
            {/* AdminLayout: header=4rem, p-6 padding → -m-6 escape */}
            <div className={cn(
                "relative flex flex-col overflow-hidden",
                user?.is_cashier
                    ? "h-[calc(100vh-7rem)]"
                    : "h-[calc(100vh-4rem)] -m-6"
            )}>
                {noSessionOverlay}
                {/* Top bar with combined search/barcode */}
                <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0",
                        isOrderOnly
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : session ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", isOrderOnly ? "bg-emerald-500" : session ? "bg-green-500" : "bg-amber-500")} />
                        {isOrderOnly ? "Order taker" : session ? "Counter cashier" : "No session"}
                    </div>
                    <span className="text-sm font-bold text-foreground hidden sm:block truncate max-w-[140px]">{branch?.name ?? "POS"}</span>
                    {branch?.business_type && (
                        <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold capitalize">
                            {branch.business_type.replace("_", " ")}
                        </span>
                    )}
                    {/* Combined search + barcode */}
                    {searchInput}
                    {/* Category dropdown — hidden for cafe/restaurant (mobile layout has its own early return) */}
                    {layout !== "cafe" && layout !== "restaurant" && (
                        <CategoryDropdown categories={categories} activeCat={activeCat} onChange={setActiveCat} />
                    )}
                    <div className="flex-1" />
                    <a href={routes.sales.history()}
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <History className="h-3.5 w-3.5" /><span className="hidden sm:block">History</span>
                    </a>
                    {pendingPaymentButton}
                    {sessionBlocked && (
                        <button
                            type="button"
                            onClick={() => setShowOpenSession(true)}
                            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                        >
                            <Unlock className="h-3.5 w-3.5" />
                            <span className="hidden sm:block">Start Session</span>
                        </button>
                    )}
                    <button onClick={() => window.location.reload()}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
                    <div className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
                        <div className="flex-1 overflow-y-auto p-3">
                            <Suspense fallback={<LayoutSpinner />}>
                                {(layout === "grid" || layout === "order_only") && <GridLayout filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick} />}
                                {layout === "tablet"     && <TabletLayout     filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick} />}
                                {layout === "grocery"    && <GroceryLayout    filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick} />}
                                {layout === "cafe"       && <CafeLayout       filtered={filtered} allProducts={products} categories={categories} activeCat={activeCat} onCatChange={setActiveCat} cart={cart} currency={currency} onProductClick={handleProductClick} />}
                                {layout === "restaurant" && <RestaurantLayout filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick} openTableOrders={open_table_orders} diningTables={dining_tables} activeTableOrderId={activeTableOrderId} onSelectTable={setActiveTableOrderId} onStartTableOrder={handleStartTableOrder} />}
                                {layout === "salon"      && <SalonLayout      filtered={filtered} cart={cart} currency={currency} onProductClick={handleProductClick} />}
                            </Suspense>
                        </div>
                    </div>

                    {/* Cart sidebar */}
                    <div className={cn(
                        "shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-border w-full lg:w-80 xl:w-96 min-h-0",
                        isOrderOnly ? "h-[42%] lg:h-auto xl:w-[26rem]" : "h-[48%] lg:h-auto",
                    )}>
                        <CartPanel cart={cart} subtotal={subtotal} itemCount={itemCount} currency={currency} error={error}
                            canCharge={canCollectPayments}
                            orderOnly={isOrderOnly}
                            onUpdateQty={updateQty} onRemove={removeItem} onClear={clearCart}
                            onCharge={startCharge} onQueue={handleQueue} />
                    </div>
                </div>
            </div>

            {variantFor && (
                <VariantPicker product={variantFor} currency={currency}
                    onSelect={(vid, vname) => { addItem(variantFor, vid, vname); setVariantFor(null); refocus(50); }}
                    onClose={() => { setVariantFor(null); refocus(50); }} />
            )}
            {showPayment && (
                <PaymentModal subtotal={subtotal} settings={settings} currency={currency}
                    customerNameRequired={requireCustomerName} promos={promos} cart={cart}
                    onConfirm={handleConfirm}
                    onClose={() => { setShowPayment(false); setError(null); refocus(50); }}
                    loading={loading} />
            )}
            {showOpenSession && (
                <OpenSessionModal currency={currency} onClose={() => { setShowOpenSession(false); refocus(50); }} />
            )}
            {showPendingPayments && (
                <PendingPaymentModal
                    orders={pendingOrders}
                    currency={currency}
                    activeOrderId={activeQueuedOrder?.id ?? null}
                    onSelect={selectPendingOrder}
                    onDelete={deletePendingOrder}
                    onClose={() => { setShowPendingPayments(false); refocus(50); }}
                />
            )}
            {receipt && <SaleSuccessModal receipt={receipt} currency={currency} installmentPlanId={installmentPlanId} onNewSale={() => { setReceipt(null); setInstallmentPlanId(null); refocus(100); }} />}
            {queuedOrder && <QueuedOrderModal order={queuedOrder} currency={currency} onClose={() => { setQueuedOrder(null); refocus(100); }} />}
        </AdminLayout>
    );
}
