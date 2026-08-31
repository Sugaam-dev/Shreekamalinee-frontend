import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, User, Package, MapPin, LogOut } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import SearchModal from "../ui/SearchModal.jsx";

import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";

export default function Navbar() {
  const { cart, wishlist, setDrawerOpen, setWishlistOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: dbCategories = [] } = useCategoriesQuery();
  const { data: storeSettings } = useBankDetailsQuery();

  // Dynamically resolve parent categories and subcategories purely from DB
  const navCategories = useMemo(() => {
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      const mainCats = dbCategories.filter((c) => !c.parentId && !c.parentCategoryId);
      return mainCats.map((main) => {
        const subcats = dbCategories
          .filter((c) => (c.parentId === main.id || c.parentCategoryId === main.id) && c.id !== main.id)
          .map((s) => s.name);
        return {
          id: main.id,
          name: main.name,
          image: main.imageUrl || "/images/placeholder-saree.jpg",
          subcats: subcats,
        };
      });
    }
    return [];
  }, [dbCategories]);



  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(true);
  const [mobileActiveCategory, setMobileActiveCategory] = useState(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const closeTimerRef = useRef(null);
  const userMenuTimerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const count = cart.reduce((s, i) => s + i.qty, 0);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const handleMegaEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDesktopOpen(true);
  };

  const handleMegaLeave = () => {
    closeTimerRef.current = setTimeout(() => setDesktopOpen(false), 150);
  };

  const handleUserEnter = () => {
    if (userMenuTimerRef.current) clearTimeout(userMenuTimerRef.current);
    setUserMenuOpen(true);
  };

  const handleUserLeave = () => {
    userMenuTimerRef.current = setTimeout(() => setUserMenuOpen(false), 150);
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Collections", path: "#", isMega: true },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  // Top Offer / Announcement Bar is visible ONLY when active and configured from Backend DB
  const isAnnouncementActive = Boolean(
    storeSettings?.isAnnouncementActive === true &&
    storeSettings?.announcementText &&
    storeSettings.announcementText.trim().length > 0
  );

  const announcementText = storeSettings?.announcementText?.trim() || "";
  const announcementLink = storeSettings?.announcementLink?.trim() || "/shop";

  const dynamicAnnouncements = useMemo(() => {
    if (!isAnnouncementActive || !announcementText) return [];

    if (storeSettings?.announcementsJson) {
      try {
        const parsed = JSON.parse(storeSettings.announcementsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore parse error
      }
    }
    return [announcementText];
  }, [storeSettings, announcementText, isAnnouncementActive]);

  const announcementLoop = dynamicAnnouncements.length > 0
    ? [...dynamicAnnouncements, ...dynamicAnnouncements, ...dynamicAnnouncements, ...dynamicAnnouncements]
    : [];

  return (
    <>
      {/* Top Offer Bar: Rendered ONLY when admin activates and configures an offer in Backend */}
      {isAnnouncementActive && dynamicAnnouncements.length > 0 && (
        <Link
          to={announcementLink}
          className="block bg-charcoal text-cream/95 text-[11px] md:text-[11.5px] tracking-[0.15em] uppercase py-2 border-b border-line/30 overflow-hidden select-none whitespace-nowrap hover:bg-black transition-colors"
        >
          <div className="animate-marquee flex items-center">
            {announcementLoop.map((item, idx) => (
              <span
                key={idx}
                className="mx-8 font-medium text-cream/95 shrink-0 flex items-center"
              >
                {item}
              </span>
            ))}
          </div>
        </Link>
      )}



      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DFD3]/80 shadow-[0_4px_25px_-5px_rgba(34,29,27,0.04)] transition-all duration-300">
        <nav className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto flex items-center justify-between px-4 sm:px-6 md:px-10 py-2 sm:py-2.5">
          {/* Brand Logo (Left) */}
          <Link
            to="/"
            className="flex items-center group transition-transform duration-300 hover:scale-[1.02] shrink-0"
          >
            <img
              src="/shreekamalineeLogo.png"
              alt="Shreekamalinee Logo"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-xs"
            />
          </Link>

          {/* Desktop Nav Items (Circle / Pill shape with subtle popup on hover) */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3.5 text-[12px] xl:text-[12.5px] tracking-[0.15em] font-medium uppercase">
            {navItems.map((item) => {
              const isItemActive = item.isMega
                ? (location.pathname.startsWith("/shop") || location.pathname.startsWith("/product")) &&
                  location.search.includes("category")
                : location.pathname === item.path && !location.search.includes("category");

              return item.isMega ? (
                <div
                  key={item.label}
                  className="py-1 relative"
                  onMouseEnter={handleMegaEnter}
                  onMouseLeave={handleMegaLeave}
                >
                  <span
                    className={`cursor-pointer px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-95 ${
                      isItemActive
                        ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-[#4A3228] font-bold border border-[#D6A23F]/50 shadow-[0_4px_16px_rgba(214,162,63,0.18)]"
                        : "text-[#221D1B]/85 hover:text-rust hover:bg-[#F4EEE3]/70 hover:shadow-xs border border-transparent hover:border-[#E6DFD3]/60"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-300 ${
                        desktopOpen ? "rotate-180 text-rust" : "text-[#221D1B]/40"
                      }`}
                    />
                  </span>

                  {/* Mega Menu Dropdown */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-300 ease-out z-50 ${
                      desktopOpen
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-2 pointer-events-none"
                    }`}
                    onMouseEnter={handleMegaEnter}
                    onMouseLeave={handleMegaLeave}
                  >
                    <div className="bg-[#FAF7F2]/98 backdrop-blur-xl border border-[#E6DFD3] shadow-[0_25px_60px_-15px_rgba(34,29,27,0.12)] p-8 rounded-sm w-[1000px] max-w-[95vw] relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D6A23F]/60 to-transparent" />
                      <div className="grid grid-cols-4 gap-8">
                        {navCategories.map((category) => (
                          <div key={category.name} className="flex flex-col gap-3 group/col">
                            <Link
                              to={`/shop?category=${encodeURIComponent(category.name)}`}
                              onClick={() => setDesktopOpen(false)}
                              className="overflow-hidden rounded-xs h-32 w-full border border-[#E6DFD3]/70 block relative shadow-xs group-hover/col:border-rust/40 transition-colors"
                            >
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover transform group-hover/col:scale-108 transition-transform duration-700 ease-out"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent group-hover/col:opacity-75 transition-opacity" />
                              <span className="absolute bottom-2 left-2 right-2 text-white text-[10.5px] font-semibold tracking-wider uppercase">
                                Explore →
                              </span>
                            </Link>

                            <Link
                              to={`/shop?category=${encodeURIComponent(category.name)}`}
                              onClick={() => setDesktopOpen(false)}
                              className="text-[12px] font-bold tracking-[0.14em] uppercase text-charcoal group-hover/col:text-rust transition-colors pb-1.5 border-b border-[#E6DFD3]/70 flex items-center justify-between"
                            >
                              <span>{category.name}</span>
                              <span className="text-[10px] text-rust opacity-0 group-hover/col:opacity-100 transition-opacity">
                                →
                              </span>
                            </Link>

                            <div className="flex flex-col gap-2">
                              {category.subcats.map((sub) => (
                                <Link
                                  key={sub}
                                  to={`/shop?category=${encodeURIComponent(
                                    category.name
                                  )}&subcat=${encodeURIComponent(sub)}`}
                                  onClick={() => setDesktopOpen(false)}
                                  className="text-[12px] font-normal tracking-[0.06em] text-charcoal/70 hover:text-rust hover:translate-x-1 transition-all duration-200 block"
                                >
                                  {sub}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:scale-95 ${
                    isItemActive
                      ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-[#4A3228] font-bold border border-[#D6A23F]/50 shadow-[0_4px_16px_rgba(214,162,63,0.18)]"
                      : "text-[#221D1B]/85 hover:text-rust hover:bg-[#F4EEE3]/70 hover:shadow-xs border border-transparent hover:border-[#E6DFD3]/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons (Search, Profile, Wishlist, Bag, Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-4 text-charcoal shrink-0">
            {/* Search Button */}
            <button
              title="Search Catalog"
              className="hover:text-rust p-1.5 sm:p-2 hover:bg-[#F4EEE3]/60 rounded-full transition-colors cursor-pointer text-charcoal/80 flex items-center justify-center active:scale-95"
              onClick={() => setSearchModalOpen(true)}
            >
              <Search size={19} className="stroke-[1.75]" />
            </button>

            {/* User Profile / Account Menu */}
            {isAuthenticated ? (
              <div
                className="relative hidden sm:block"
                onMouseEnter={handleUserEnter}
                onMouseLeave={handleUserLeave}
              >
                <button
                  onClick={() => navigate("/account/profile")}
                  className="hover:text-rust py-1 px-2.5 hover:bg-[#F4EEE3]/80 rounded-full transition-all cursor-pointer text-charcoal/90 flex items-center gap-2 border border-[#E6DFD3]/80 active:scale-95 shadow-2xs"
                  title="My Royal Account"
                >
                  <div className="w-6 h-6 rounded-full bg-rust text-white font-serif font-bold text-[11px] flex items-center justify-center shadow-xs">
                    {(user?.firstName || user?.name || user?.email || "P").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[12px] font-semibold text-charcoal max-w-[100px] truncate">
                    {user?.firstName || user?.name?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 text-charcoal/50 ${
                      userMenuOpen ? "rotate-180 text-rust" : ""
                    }`}
                  />
                </button>

                {/* User Dropdown */}
                <div
                  className={`absolute right-0 top-full pt-2 w-56 transition-all duration-200 z-50 ${
                    userMenuOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="bg-white border border-line rounded-sm shadow-xl p-2 text-xs">
                    <div className="px-3 py-2 border-b border-line mb-1 bg-[#FAF7F2]/60 rounded-xs">
                      <p className="font-serif font-bold text-sm text-charcoal truncate">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.fullName || user?.name || user?.email?.split("@")[0] || "Patron")}
                      </p>
                      <p className="text-[11px] text-charcoal/50 truncate">{user?.email}</p>
                    </div>

                    {(user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPERADMIN") && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[#800020] bg-[#800020]/5 font-bold hover:bg-[#800020]/10 rounded-xs transition-colors mb-1"
                      >
                        <span className="font-bold">Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/account/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-charcoal/80 hover:bg-cream-2 hover:text-rust rounded-xs transition-colors"
                    >
                      <User size={14} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/account/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-charcoal/80 hover:bg-cream-2 hover:text-rust rounded-xs transition-colors"
                    >
                      <Package size={14} />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/account/addresses"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-charcoal/80 hover:bg-cream-2 hover:text-rust rounded-xs transition-colors"
                    >
                      <MapPin size={14} />
                      <span>Saved Addresses</span>
                    </Link>

                    <Link
                      to="/account/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-charcoal/80 hover:bg-cream-2 hover:text-rust rounded-xs transition-colors"
                    >
                      <Heart size={14} />
                      <span>My Wishlist</span>
                    </Link>

                    <div className="border-t border-line mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate("/login");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors text-left cursor-pointer font-medium"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-charcoal/90 hover:text-rust bg-[#FAF7F2] hover:bg-[#F4EEE3] border border-[#E6DFD3] hover:border-rust/40 transition-all shadow-2xs active:scale-95"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-rust hover:bg-rust-deep transition-all shadow-2xs active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}


            {/* Wishlist Button */}
            <button
              title="Wishlist"
              className="relative hover:text-rust p-1.5 sm:p-2 hover:bg-[#F4EEE3]/60 rounded-full transition-colors cursor-pointer text-charcoal/80 flex items-center active:scale-95"
              onClick={() => setWishlistOpen(true)}
            >
              <Heart size={19} className="stroke-[1.75]" />
              {wishlist.size > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rust text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#FAF7F2]">
                  {wishlist.size}
                </span>
              )}
            </button>

            {/* Shopping Bag Button */}
            <button
              title="Bag"
              onClick={() => setDrawerOpen(true)}
              className="relative hover:text-rust p-1.5 sm:p-2 hover:bg-[#F4EEE3]/60 rounded-full transition-colors cursor-pointer text-charcoal/80 flex items-center active:scale-95"
            >
              <ShoppingBag size={19} className="stroke-[1.75]" />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rust text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#FAF7F2]">
                  {count}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger (Right Side) */}
            <button
              className="lg:hidden p-2 hover:bg-[#F4EEE3] rounded-full text-charcoal cursor-pointer active:scale-95 ml-1 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} className="stroke-[2]" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer (Rendered outside header to avoid backdrop-filter stacking issues) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] lg:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Container (Slides smoothly from Right) */}
          <div className="relative w-[85vw] max-w-xs sm:max-w-sm bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between z-10 border-l border-[#E6DFD3] animate-slideLeft">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-[#E6DFD3] flex items-center justify-between bg-white/90 backdrop-blur-xs">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center"
              >
                <img
                  src="/shreekamalineeLogo.png"
                  alt="Shreekamalinee Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </Link>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-charcoal/70 hover:text-charcoal hover:bg-[#FAF7F2] rounded-full transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} className="stroke-[2]" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* In-Drawer Quick Search */}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setSearchModalOpen(true);
                }}
                className="w-full py-2.5 px-3.5 bg-white border border-[#E6DFD3] rounded-full flex items-center gap-2.5 text-xs text-charcoal/70 shadow-xs hover:border-[#D6A23F] transition-colors"
              >
                <Search size={14} className="text-rust" />
                <span>Search Sarees, Weaves, SKU...</span>
              </button>

              {/* Navigation Links */}
              <div className="space-y-1.5 pt-1">
                {/* Home */}
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 px-3.5 rounded-full uppercase tracking-[0.12em] text-xs font-bold transition-all ${
                    location.pathname === "/"
                      ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-rust border border-[#D6A23F]/50 shadow-xs"
                      : "text-charcoal hover:bg-[#F4EEE3]/60"
                  }`}
                >
                  Home
                </Link>

                {/* Collections Accordion */}
                <div className="border-t border-b border-[#E6DFD3]/70 py-1">
                  <button
                    onClick={() => setMobileCollectionsOpen(!mobileCollectionsOpen)}
                    className="flex items-center justify-between w-full py-2 px-3 uppercase tracking-[0.12em] text-xs font-bold text-charcoal cursor-pointer"
                  >
                    <span>Collections</span>
                    <ChevronDown
                      size={15}
                      className={`transform transition-transform duration-200 ${
                        mobileCollectionsOpen ? "rotate-180 text-rust" : "text-charcoal/60"
                      }`}
                    />
                  </button>

                  {mobileCollectionsOpen && (
                    <div className="pl-3 pr-1 py-2 space-y-2.5 border-l-2 border-rust/40 ml-3 bg-[#F4EEE3]/40 rounded-r-md">
                      {navCategories.map((category) => {
                        const isCatOpen = mobileActiveCategory === category.name;
                        return (
                          <div
                            key={category.name}
                            className="border-b border-[#E6DFD3]/50 pb-2 last:border-b-0 last:pb-0"
                          >
                            <button
                              onClick={() =>
                                setMobileActiveCategory(
                                  isCatOpen ? null : category.name
                                )
                              }
                              className="flex items-center justify-between w-full text-left py-1 text-xs font-bold uppercase text-rust cursor-pointer"
                            >
                              <span>{category.name}</span>
                              <ChevronDown
                                size={13}
                                className={`transform transition-transform duration-200 ${
                                  isCatOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {isCatOpen && (
                              <div className="pl-3 py-1.5 space-y-2 border-l border-[#D6A23F]/40 mt-1.5">
                                <Link
                                  to={`/shop?category=${encodeURIComponent(
                                    category.name
                                  )}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="text-[11.5px] text-rust font-bold uppercase tracking-wider block hover:underline"
                                >
                                  • View All {category.name} →
                                </Link>
                                {category.subcats.map((sub) => (
                                  <Link
                                    key={sub}
                                    to={`/shop?category=${encodeURIComponent(
                                      category.name
                                    )}&subcat=${encodeURIComponent(sub)}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-[11.5px] font-medium text-charcoal/80 hover:text-rust block py-0.5 transition-colors"
                                  >
                                    {sub}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 px-3.5 rounded-full uppercase tracking-[0.12em] text-xs font-bold transition-all ${
                    location.pathname === "/about"
                      ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-rust border border-[#D6A23F]/50 shadow-xs"
                      : "text-charcoal hover:bg-[#F4EEE3]/60"
                  }`}
                >
                  About
                </Link>

                {/* Contact */}
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 px-3.5 rounded-full uppercase tracking-[0.12em] text-xs font-bold transition-all ${
                    location.pathname === "/contact"
                      ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-rust border border-[#D6A23F]/50 shadow-xs"
                      : "text-charcoal hover:bg-[#F4EEE3]/60"
                  }`}
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Drawer Footer (Account & Quick Help) */}
            <div className="p-4 border-t border-[#E6DFD3] bg-white space-y-2.5">
              {isAuthenticated ? (
                <div className="space-y-1.5">
                  <div className="px-3 py-2 bg-[#FAF7F2] border border-[#E6DFD3] rounded-sm text-xs mb-2">
                    <p className="font-bold text-charcoal truncate">
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName || ""}`
                        : user?.email || "Patron"}
                    </p>
                    <p className="text-[10.5px] text-charcoal/50 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {(user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPERADMIN") && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="py-1.5 px-3 rounded-sm flex items-center gap-2 text-xs font-bold text-rust bg-rust/5 hover:bg-rust/10"
                    >
                      <User size={14} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <Link
                    to="/account/profile"
                    onClick={() => setMobileOpen(false)}
                    className="py-1.5 px-3 rounded-sm flex items-center gap-2 text-xs font-medium text-charcoal/80 hover:bg-[#F4EEE3]"
                  >
                    <User size={14} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/account/orders"
                    onClick={() => setMobileOpen(false)}
                    className="py-1.5 px-3 rounded-sm flex items-center gap-2 text-xs font-medium text-charcoal/80 hover:bg-[#F4EEE3]"
                  >
                    <Package size={14} />
                    <span>My Orders</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-left py-1.5 px-3 rounded-sm flex items-center gap-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full py-2.5 text-center bg-rust text-white font-bold rounded-full uppercase tracking-wider text-xs shadow-xs hover:bg-rust-deep transition-colors"
                  >
                    Login / Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full py-2 text-center border border-line text-charcoal font-semibold rounded-full uppercase tracking-wider text-xs bg-white hover:bg-cream-2 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal Overlay */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
