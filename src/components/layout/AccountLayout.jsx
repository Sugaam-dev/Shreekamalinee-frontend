import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Package, MapPin, Heart, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import Breadcrumb from "../common/Breadcrumb.jsx";

export default function AccountLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const { wishlist } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "My Profile", path: "/account/profile", icon: User },
    { label: "My Orders", path: "/account/orders", icon: Package },
    { label: "Saved Addresses", path: "/account/addresses", icon: MapPin },
    {
      label: "My Wishlist",
      path: "/account/wishlist",
      icon: Heart,
      badge: wishlist.size > 0 ? wishlist.size : null,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.fullName || (user?.email ? user.email.split("@")[0] : "Patron");

  return (
    <div className="bg-cream min-h-screen py-6 sm:py-8 md:py-12">
      <div className="max-w-[1280px] 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12">
        <Breadcrumb
          items={[
            { label: "My Account", to: "/account/profile" },
            ...(title ? [{ label: title }] : []),
          ]}
        />

        <div className="grid lg:grid-cols-[280px_1fr] 2xl:grid-cols-[320px_1fr] gap-6 lg:gap-10 2xl:gap-16 items-start mt-4">

          {/* Left Sidebar */}
          <aside className="bg-white border border-line rounded-sm p-6 shadow-xs">
            {/* User Quick Info */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-line">
              <div className="w-12 h-12 rounded-full bg-[#800020] text-white flex items-center justify-center font-serif text-lg font-bold shrink-0 shadow-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10.5px] uppercase tracking-wider text-charcoal/50 font-medium">
                  Namaste,
                </span>
                <h3 className="font-serif font-bold text-base text-charcoal truncate">
                  {displayName}
                </h3>
                <span className="text-[11px] text-charcoal/55 truncate block">
                  {user?.email || "No email available"}
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-rust text-white shadow-xs"
                        : "text-charcoal/80 hover:bg-cream-2 hover:text-rust"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-white text-rust"
                            : "bg-rust/10 text-rust"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        size={14}
                        className={isActive ? "text-white" : "text-charcoal/30"}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Security Assurance Badge */}
            <div className="pt-4 border-t border-line space-y-3">
              <div className="p-2.5 bg-cream-2/40 rounded-xs border border-line flex items-center gap-2 text-[11px] text-charcoal/70">
                <ShieldCheck size={14} className="text-rust shrink-0" />
                <span>
                  {user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPERADMIN"
                    ? "Administrator Account"
                    : "Verified Customer Account"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xs text-xs font-bold text-charcoal/70 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Account Content Area */}
          <main className="bg-white border border-line rounded-sm p-6 md:p-10 shadow-xs">
            {title && (
              <div className="pb-6 mb-6 border-b border-line">
                <h1 className="font-serif text-2xl font-bold text-charcoal">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-charcoal/60 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
