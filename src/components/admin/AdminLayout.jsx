import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  Package,
  ClipboardList,
  Tag,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAdminDashboardStatsQuery } from "../../queries/useOrderQueries.js";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCouponsQuery } from "../../queries/useCouponQueries.js";

export default function AdminLayout({ children, title, subtitle, actions }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live query hooks for sidebar badges
  const { data: stats } = useAdminDashboardStatsQuery();
  const { data: products = [] } = useProductsQuery();
  const { data: coupons = [] } = useCouponsQuery();

  // Compute live inventory alert count
  const inventoryAlerts = useMemo(() => {
    let alerts = 0;
    products.forEach((p) => {
      const variants = p.variants || [];
      variants.forEach((v) => {
        const qty = Number(v.stockQuantity) || 0;
        if (qty <= 3) alerts++;
      });
    });
    return alerts;
  }, [products]);

  // Compute live pending orders count (placed/processing or pending manual receipts)
  const pendingOrdersCount = stats?.statusBreakdown?.PLACED || stats?.statusBreakdown?.PROCESSING || 0;

  // Compute active coupons count
  const activeCouponsCount = useMemo(() => {
    const now = new Date();
    return coupons.filter((c) => c.active && (!c.expiryDate || new Date(c.expiryDate) >= now)).length;
  }, [coupons]);

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Categories & Weaves",
      path: "/admin/categories",
      icon: Layers,
    },
    {
      label: "Products Catalog",
      path: "/admin/products",
      icon: ShoppingBag,
      badge: products.length > 0 ? `${products.length}` : null,
      badgeTitle: `${products.length} Total Catalog Products`,
      badgeBg: "bg-white/20 text-white",
    },
    {
      label: "Inventory & Stock",
      path: "/admin/inventory",
      icon: Package,
      badge: inventoryAlerts > 0 ? `${inventoryAlerts}` : null,
      badgeTitle: `${inventoryAlerts} SKUs needing restock (≤3 units)`,
      badgeBg: "bg-amber-500 text-white font-bold",
    },
    {
      label: "Orders & Payment Audit",
      path: "/admin/orders",
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : null,
      badgeTitle: `${pendingOrdersCount} Orders pending fulfillment/audit`,
      badgeBg: "bg-rose-500 text-white font-bold",
    },
    {
      label: "Discount Coupons",
      path: "/admin/coupons",
      icon: Tag,
      badge: activeCouponsCount > 0 ? `${activeCouponsCount}` : null,
      badgeTitle: `${activeCouponsCount} Active Discount Vouchers`,
      badgeBg: "bg-emerald-600 text-white",
    },
    {
      label: "Reviews & Feedback",
      path: "/admin/reviews",
      icon: MessageSquare,
    },
    {
      label: "Customer CRM",
      path: "/admin/customers",
      icon: Users,
    },
    {
      label: "Customer Inquiries",
      path: "/admin/inquiries",
      icon: Mail,
    },
    {
      label: "Store & Bank Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  // User initials
  const initials =
    ((user?.firstName?.[0] || "A") + (user?.lastName?.[0] || "D")).toUpperCase();

  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const displayRole = (role || user?.role || "ROLE_ADMIN").replace("ROLE_", "");

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#212529] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#212529]/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#800020] text-[#FAF7F2] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-white/15 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <img
                src="/shreekamalineeLogo.png"
                alt="Shreekamalinee Admin"
                className="h-9 w-auto object-contain brightness-200"
              />
              <div>
                <span className="font-serif font-bold text-sm tracking-wider block text-white leading-tight">
                  SHREEKAMALINEE
                </span>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#B8860B] block">
                  Admin Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)] no-scrollbar">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 px-3 py-2 block">
              Admin Navigation
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/admin/dashboard"
                  ? location.pathname === "/admin" || location.pathname === "/admin/dashboard"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-all gap-2 ${
                    isActive
                      ? "bg-[#B8860B] text-[#212529] font-bold shadow-xs"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Icon size={15} className={`shrink-0 ${isActive ? "text-[#212529]" : "text-white/60"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      title={item.badgeTitle}
                      className={`min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs leading-none whitespace-nowrap ${
                        isActive
                          ? "bg-[#800020] text-white"
                          : item.badgeBg || "bg-white/20 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/15 space-y-2 bg-[#6b001b]">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xs text-xs text-white/90 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink size={13} className="text-[#B8860B]" />
              <span>View Live Store</span>
            </div>
            <ChevronRight size={13} className="text-white/40" />
          </Link>

          <button
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xs text-xs text-rose-200 hover:bg-rose-900/40 transition-colors cursor-pointer text-left font-semibold"
          >
            <LogOut size={13} />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#212529] hover:bg-[#F4EEE3] rounded-xs cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-serif font-bold text-lg md:text-xl text-[#212529]">
                {title || "Admin Dashboard"}
              </h2>
              {subtitle && <p className="text-[11px] text-[#212529]/60">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
         

            {/* Actions button passed from child pages */}
            {actions}

            {/* Admin Profile Details */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5E7EB]">
              <div className="w-8 h-8 rounded-full bg-[#800020] text-[#B8860B] font-serif font-bold flex items-center justify-center text-xs border border-[#B8860B]/50 shadow-2xs">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <strong className="text-xs text-[#212529] block leading-none truncate max-w-[130px]">
                  {displayName}
                </strong>
                <span className="text-[10px] text-[#800020] font-bold uppercase tracking-wider block mt-0.5">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10 max-w-[1700px] 2xl:max-w-[2200px] 3xl:max-w-[2600px] 4k:max-w-[3200px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

