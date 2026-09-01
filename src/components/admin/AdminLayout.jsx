import { useState, useMemo, useEffect } from "react";
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
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("shreekamalinee_admin_sidebar_collapsed") === "true";
    }
    return false;
  });

  // Close mobile sidebar on route change & escape key
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("shreekamalinee_admin_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

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

  // Compute live pending orders count
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
      label: "Revenue & Analytics",
      path: "/admin/revenue",
      icon: TrendingUp,
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
      label: "Orders & Audit",
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
      label: "Store & Settings",
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
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Responsive for Mobile Drawer & Collapsible Desktop (320px to 4K) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#800020] text-[#FAF7F2] flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xl border-r border-black/10 ${
          sidebarOpen
            ? "translate-x-0 w-[84vw] max-w-[280px] xs:w-72 sm:w-80"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20 4k:w-24" : "lg:w-64 4k:w-80"}`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand Header */}
          <div className="p-3.5 xs:p-4 sm:p-5 4k:p-6 border-b border-white/15 flex items-center justify-between shrink-0">
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-2 xs:gap-2.5 transition-all overflow-hidden ${
                isCollapsed ? "lg:justify-center lg:w-full" : ""
              }`}
            >
              <img
                src="/shreekamalineeLogo.png"
                alt="Shreekamalinee Admin"
                className="h-7 xs:h-8 sm:h-9 4k:h-11 w-auto object-contain brightness-200 shrink-0"
              />
              <div className={`overflow-hidden transition-all ${isCollapsed ? "lg:hidden" : "block"}`}>
                <span className="font-serif font-bold text-xs xs:text-sm 4k:text-base tracking-wider block text-white leading-tight truncate">
                  SHREEKAMALINEE
                </span>
                <span className="text-[8.5px] xs:text-[9px] 4k:text-[10px] uppercase font-bold tracking-[0.2em] text-[#B8860B] block truncate">
                  Admin Portal
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1 rounded-xs hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links with Custom Scrollbar */}
          <nav className="p-2 xs:p-2.5 sm:p-3 4k:p-4 space-y-1 overflow-y-auto flex-1 no-scrollbar overscroll-contain">
            <span
              className={`text-[9px] xs:text-[10px] 4k:text-[11px] uppercase font-bold tracking-[0.2em] text-white/40 px-3 py-1.5 block ${
                isCollapsed ? "lg:hidden" : "block"
              }`}
            >
              Navigation
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/admin/dashboard"
                  ? location.pathname === "/admin" || location.pathname === "/admin/dashboard"
                  : location.pathname.startsWith(item.path);

              return (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center min-h-[40px] xs:min-h-[42px] px-2.5 xs:px-3 sm:px-3.5 py-2 xs:py-2.5 rounded-xs text-[11px] xs:text-xs 4k:text-sm font-semibold uppercase tracking-wider transition-all gap-2 xs:gap-2.5 ${
                      isCollapsed ? "lg:justify-center lg:px-2" : "justify-between"
                    } ${
                      isActive
                        ? "bg-[#B8860B] text-[#212529] font-bold shadow-xs"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 xs:gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={`shrink-0 transition-transform 4k:scale-125 ${
                          isActive ? "text-[#212529]" : "text-white/70 group-hover:scale-105"
                        }`}
                      />
                      <span className={`truncate ${isCollapsed ? "lg:hidden" : "block"}`}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span
                        title={item.badgeTitle}
                        className={`min-w-[17px] h-[17px] xs:min-w-[18px] xs:h-[18px] px-1.5 rounded-full flex items-center justify-center text-[9px] xs:text-[10px] font-bold shrink-0 shadow-2xs leading-none whitespace-nowrap ${
                          isCollapsed ? "lg:hidden" : "block"
                        } ${
                          isActive
                            ? "bg-[#800020] text-white"
                            : item.badgeBg || "bg-white/20 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Small badge dot in collapsed desktop mode */}
                    {isCollapsed && item.badge && (
                      <span className="hidden lg:block absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#800020]" />
                    )}
                  </Link>

                  {/* Desktop Hover Tooltip for Collapsed Sidebar */}
                  {isCollapsed && (
                    <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 bg-[#212529] text-white text-xs font-semibold px-2.5 py-1.5 rounded-xs shadow-xl whitespace-nowrap items-center gap-2 pointer-events-none">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-2.5 xs:p-3 sm:p-4 border-t border-white/15 space-y-1.5 bg-[#6b001b] shrink-0">
            <Link
              to="/"
              target="_blank"
              className={`flex items-center rounded-xs text-[11px] xs:text-xs 4k:text-sm text-white/90 hover:bg-white/10 transition-colors ${
                isCollapsed ? "lg:justify-center lg:p-2.5" : "justify-between px-3 py-2"
              }`}
              title="View Live Store"
            >
              <div className="flex items-center gap-2">
                <ExternalLink size={14} className="text-[#B8860B] shrink-0 4k:scale-110" />
                <span className={isCollapsed ? "lg:hidden" : "block truncate"}>View Live Store</span>
              </div>
              <ChevronRight size={13} className={`text-white/40 ${isCollapsed ? "lg:hidden" : "block"}`} />
            </Link>

            <button
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
              className={`w-full flex items-center rounded-xs text-[11px] xs:text-xs 4k:text-sm text-rose-200 hover:bg-rose-900/40 transition-colors cursor-pointer text-left font-semibold ${
                isCollapsed ? "lg:justify-center lg:p-2.5" : "gap-2 px-3 py-2"
              }`}
              title="Admin Logout"
            >
              <LogOut size={14} className="shrink-0 4k:scale-110" />
              <span className={isCollapsed ? "lg:hidden" : "block truncate"}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20 4k:pl-24" : "lg:pl-64 4k:pl-80"
        }`}
      >
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E5E7EB] px-3 xs:px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3.5 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 xs:p-2 text-[#212529] hover:bg-[#F4EEE3] rounded-xs cursor-pointer transition-colors"
              aria-label="Open navigation drawer"
            >
              <Menu size={19} />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 text-gray-600 hover:text-[#800020] hover:bg-[#F4EEE3] rounded-xs cursor-pointer transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              {isCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>

            <div className="min-w-0">
              <h1 className="font-serif font-bold text-sm xs:text-base sm:text-lg md:text-xl 3xl:text-2xl 4k:text-3xl text-[#212529] truncate">
                {title || "Admin Dashboard"}
              </h1>
              {subtitle && <p className="text-[10px] xs:text-[11px] 4k:text-xs text-[#212529]/60 truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-4 shrink-0">
            {/* Actions button passed from child pages */}
            {actions}

            {/* Admin Profile Details */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 pl-1.5 xs:pl-2 sm:pl-3 border-l border-[#E5E7EB]">
              <div className="w-7 h-7 xs:w-8 xs:h-8 4k:w-10 4k:h-10 rounded-full bg-[#800020] text-[#B8860B] font-serif font-bold flex items-center justify-center text-[11px] xs:text-xs 4k:text-sm border border-[#B8860B]/50 shadow-2xs shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <strong className="text-xs 4k:text-sm text-[#212529] block leading-none truncate max-w-[130px]">
                  {displayName}
                </strong>
                <span className="text-[10px] 4k:text-xs text-[#800020] font-bold uppercase tracking-wider block mt-0.5">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-2.5 xs:p-4 sm:p-6 lg:p-8 2xl:p-10 4k:p-12 max-w-[1700px] 2xl:max-w-[2200px] 3xl:max-w-[2600px] 4k:max-w-[3400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


