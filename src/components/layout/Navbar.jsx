import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { COLLECTION_CATEGORIES } from "../../data/products/products.js";

export default function Navbar() {
  const { cart, wishlist, setDrawerOpen, setWishlistOpen, showToast } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [mobileActiveCategory, setMobileActiveCategory] = useState(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const handleMegaEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDesktopOpen(true);
  };

  const handleMegaLeave = () => {
    closeTimerRef.current = setTimeout(() => setDesktopOpen(false), 150);
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const count = cart.reduce((s, i) => s + i.qty, 0);

  let Flashsale = false ;

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Collections", path: "#", isMega: true },
    { label: "Contact", path: "/contact" },
    //{ label: "Login", path: "/login", isLogin: true }
  ];

  function handleLoginClick(e) {
    e.preventDefault();
    showToast("Register/Login modal triggered! (Client Mockup)");
    setMobileOpen(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/product?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  return (
    <>
    {Flashsale &&
      <div className="bg-charcoal text-cream/95 text-[11.5px] tracking-[0.15em] uppercase text-center py-2.5 px-2 font-medium">
        ✨ Festive Edit Live — Premium Handloom Collections — Free Shipping over ₹1,499 ✨
      </div>
}

      <header className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E6DFD3]/80 shadow-[0_4px_25px_-5px_rgba(34,29,27,0.04)] transition-all duration-300">
        <nav className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto flex items-center justify-between px-6 md:px-10 py-2.5">
          <Link 
            to="/" 
            className="flex items-center group transition-transform duration-300 hover:scale-[1.02]"
          >
            <img
              src="/shreekamalineeLogo.png"
              alt="Shreekamalinee Logo"
              className="h-20 md:h-22 w-auto object-contain drop-shadow-xs"
            />
          </Link>
          <div className="hidden lg:flex items-center gap-3.5 text-[12.5px] tracking-[0.15em] font-medium uppercase">
            {navItems.map((item) => {
              const isItemActive = item.isMega
                ? location.pathname.startsWith("/product") && location.search.includes("category")
                : location.pathname === item.path && !location.search.includes("category");

              return item.isLogin ? (
                <a
                  key={item.label}
                  href="#login"
                  onClick={handleLoginClick}
                  className="px-4 py-1.5 rounded-full border border-[#BD5B34]/30 text-rust font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-rust hover:bg-gradient-to-r hover:from-[#F4EEE3] hover:to-[#FAF7F2] hover:shadow-[0_4px_14px_rgba(189,91,52,0.15)]"
                >
                  {item.label}
                </a>
              ) : item.isMega ? (
                <div 
                  key={item.label} 
                  className="py-1"
                  onMouseEnter={handleMegaEnter}
                  onMouseLeave={handleMegaLeave}
                >
                  <span
                    className={`cursor-pointer px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-300 ease-out ${
                      isItemActive
                        ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-[#4A3228] font-bold border border-[#D6A23F]/50 shadow-[0_4px_16px_rgba(214,162,63,0.18)] -translate-y-0.5 scale-[1.02]"
                        : "text-[#221D1B]/85 border border-transparent hover:border-[#E6DFD3] hover:bg-[#F4EEE3]/60 hover:text-[#BD5B34] hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_4px_14px_rgba(34,29,27,0.06)]"
                    }`}
                  >
                    {item.label}
                    <ChevronDown size={13} className={`transition-transform duration-300 ${desktopOpen ? "rotate-180 text-rust" : "text-[#221D1B]/40"} ${
                      isItemActive ? "text-rust" : ""
                    }`} />
                  </span>
                  {/* Mega Menu Dropdown */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-300 ease-out z-50 ${
                      desktopOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                    }`}
                    onMouseEnter={handleMegaEnter}
                    onMouseLeave={handleMegaLeave}
                  >
                    {/* Transparent hover bridge fills the exact pt-2 (8px) gap without shifting the dropdown */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-[1050px] max-w-[98vw] bg-transparent" />
                    <div className="bg-[#FAF7F2]/98 backdrop-blur-xl border border-[#E6DFD3] shadow-[0_25px_60px_-15px_rgba(34,29,27,0.12)] p-8 rounded-lg w-[1000px] max-w-[95vw] relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D6A23F]/60 to-transparent" />
                      <div className="grid grid-cols-4 gap-8">
                        {COLLECTION_CATEGORIES.map((category) => (
                          <div key={category.name} className="flex flex-col gap-3.5 group/col">
                            {/* Category image card on top */}
                            <Link
                              to={`/product?category=${encodeURIComponent(category.name)}`}
                              onClick={() => setDesktopOpen(false)}
                              className="overflow-hidden rounded-md h-32 w-full border border-[#E6DFD3]/70 block relative shadow-sm group-hover/col:border-rust/40 transition-colors duration-300"
                            >
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover transform group-hover/col:scale-108 transition-transform duration-700 ease-out"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent group-hover/col:opacity-75 transition-opacity duration-300" />
                              <span className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px] font-medium tracking-wider uppercase drop-shadow-md">
                                Explore Collection →
                              </span>
                            </Link>

                            <Link
                              to={`/product?category=${encodeURIComponent(category.name)}`}
                              onClick={() => setDesktopOpen(false)}
                              className="text-[12px] font-bold tracking-[0.14em] uppercase text-charcoal group-hover/col:text-rust transition-colors pb-2 border-b border-[#E6DFD3]/70 flex items-center justify-between"
                            >
                              <span>{category.name}</span>
                              <span className="text-[10px] text-rust opacity-0 group-hover/col:opacity-100 transition-opacity font-normal">→</span>
                            </Link>
                            <div className="flex flex-col gap-2">
                              {category.subcats.map((sub) => (
                                <Link
                                  key={sub}
                                  to={`/product?category=${encodeURIComponent(
                                    category.name
                                  )}&subcat=${encodeURIComponent(sub)}`}
                                  onClick={() => setDesktopOpen(false)}
                                  className="text-[12px] font-normal tracking-[0.14em] uppercase text-charcoal/70 hover:text-rust hover:translate-x-1.5 transition-all duration-200 block normal-case py-0.5"
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
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 ease-out ${
                    isItemActive
                      ? "bg-gradient-to-r from-[#F4EEE3] via-[#EFE6D5] to-[#F4EEE3] text-[#4A3228] font-bold border border-[#D6A23F]/50 shadow-[0_4px_16px_rgba(214,162,63,0.18)] -translate-y-0.5 scale-[1.02]"
                      : "text-[#221D1B]/85 border border-transparent hover:border-[#E6DFD3] hover:bg-[#F4EEE3]/60 hover:text-[#BD5B34] hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_4px_14px_rgba(34,29,27,0.06)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-charcoal">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border border-rust/40 bg-white/90 shadow-sm px-3 py-1.5 rounded-full animate-fadeIn ring-2 ring-rust/10">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search royal attire..."
                  className="w-32 sm:w-48 text-xs outline-none bg-transparent text-charcoal placeholder:text-charcoal/40 font-normal"
                  autoFocus
                />
                <button type="submit" className="text-rust hover:text-rust-deep transition-colors cursor-pointer p-0.5">
                  <Search size={15} className="stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchVal("");
                  }}
                  className="text-charcoal/50 hover:text-rust transition-colors cursor-pointer p-0.5"
                >
                  <X size={15} className="stroke-[2.2]" />
                </button>
              </form>
            ) : (
              <button
                title="Search"
                className="hover:text-rust p-2 hover:bg-[#F4EEE3]/60 rounded-full transition-all duration-300 cursor-pointer text-charcoal/85 active:scale-95"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={19} className="stroke-[1.75]" />
              </button>
            )}

            <button
              title="Wishlist"
              className="relative hover:text-rust p-2 hover:bg-[#F4EEE3]/60 rounded-full transition-all duration-300 cursor-pointer text-charcoal/85 flex items-center active:scale-95 group"
              onClick={() => setWishlistOpen(true)}
            >
              <Heart size={19} className="stroke-[1.75] group-hover:scale-110 transition-transform duration-300" />
              {wishlist.size > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gradient-to-r from-rust to-[#a45e35] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#FAF7F2] animate-bounce">
                  {wishlist.size}
                </span>
              )}
            </button>

            <button
              title="Bag"
              onClick={() => setDrawerOpen(true)}
              className="relative hover:text-rust p-2 hover:bg-[#F4EEE3]/60 rounded-full transition-all duration-300 cursor-pointer text-charcoal/85 flex items-center active:scale-95 group"
            >
              <ShoppingBag size={19} className="stroke-[1.75] group-hover:scale-110 transition-transform duration-300" />
              <span className="absolute top-0.5 right-0.5 bg-gradient-to-r from-rust to-[#a45e35] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#FAF7F2]">
                {count}
              </span>
            </button>

            <button
              className="lg:hidden cursor-pointer p-2 hover:bg-[#F4EEE3]/60 rounded-lg transition-colors text-charcoal/85 flex items-center"
              onClick={() => {
                setMobileOpen((v) => !v);
                setMobileCollectionsOpen(false);
                setMobileActiveCategory(null);
              }}
            >
              {mobileOpen ? <X size={22} className="stroke-[1.85]" /> : <Menu size={22} className="stroke-[1.85]" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden flex flex-col px-6 pb-6 pt-3 gap-3 text-sm uppercase tracking-[0.1em] font-medium border-t border-[#E6DFD3]/80 bg-[#FAF7F2] shadow-xl animate-fadeIn">
            {navItems.map((item) => (
              item.isLogin ? (
                <a 
                  key={item.label} 
                  href="#login"
                  onClick={handleLoginClick} 
                  className="py-2.5 px-4 rounded-md text-rust font-semibold hover:bg-[#F4EEE3]"
                >
                  {item.label}
                </a>
              ) : item.isMega ? (
                <div key={item.label} className="flex flex-col">
                  <button 
                    onClick={() => {
                      setMobileCollectionsOpen(!mobileCollectionsOpen);
                      setMobileActiveCategory(null);
                    }}
                    className="flex items-center justify-between py-2.5 px-4 rounded-md w-full text-left uppercase tracking-[0.1em] font-medium text-charcoal hover:bg-[#F4EEE3] hover:text-rust cursor-pointer transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronDown size={16} className={`transform transition-transform duration-300 ${mobileCollectionsOpen ? "rotate-180 text-rust" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileCollectionsOpen ? "max-h-[1000px] opacity-100 my-2" : "max-h-0 opacity-0"}`}>
                    <div className="pl-4 pr-2 border-l-2 border-rust/30 flex flex-col gap-3 py-2 ml-4 bg-[#F4EEE3]/40 rounded-r-md">
                      {COLLECTION_CATEGORIES.map((category) => {
                        const isCatOpen = mobileActiveCategory === category.name;
                        return (
                          <div key={category.name} className="flex flex-col border-b border-[#E6DFD3]/50 pb-2.5 last:border-b-0 last:pb-0">
                            <button
                              onClick={() => setMobileActiveCategory(isCatOpen ? null : category.name)}
                              className="flex items-center justify-between w-full text-left py-1 text-xs font-bold tracking-wider uppercase text-rust hover:text-rust-deep cursor-pointer"
                            >
                              <span>{category.name}</span>
                              <ChevronDown size={14} className={`transform transition-transform duration-200 ${isCatOpen ? "rotate-180" : ""}`} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCatOpen ? "max-h-[500px] opacity-100 mt-2 mb-1" : "max-h-0 opacity-0"}`}>
                              <div className="flex flex-col gap-2 pl-3 border-l border-[#E6DFD3]">
                                <Link
                                  to={`/product?category=${encodeURIComponent(category.name)}`}
                                  onClick={() => {
                                    setMobileOpen(false);
                                    setMobileCollectionsOpen(false);
                                    setMobileActiveCategory(null);
                                  }}
                                  className="text-xs text-rust font-semibold hover:text-rust-deep block normal-case py-0.5"
                                >
                                  View All {category.name} →
                                </Link>
                                {category.subcats.map((sub) => (
                                  <Link
                                    key={sub}
                                    to={`/product?category=${encodeURIComponent(category.name)}&subcat=${encodeURIComponent(sub)}`}
                                    onClick={() => {
                                      setMobileOpen(false);
                                      setMobileCollectionsOpen(false);
                                      setMobileActiveCategory(null);
                                    }}
                                    className="text-xs text-charcoal/80 hover:text-rust block normal-case font-normal py-0.5 transition-colors"
                                  >
                                    {sub}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2.5 px-4 rounded-md flex items-center justify-between transition-all duration-300 ${
                    location.pathname === item.path
                      ? "bg-[#F4EEE3] text-[#4A3228] font-bold border-l-4 border-[#BD5B34] shadow-xs"
                      : "text-charcoal font-medium hover:bg-[#F4EEE3] hover:text-[#4A3228] hover:translate-x-1"
                  }`}
                >
                  <span>{item.label}</span>
                  {location.pathname === item.path && <span className="text-rust text-xs">✦</span>}
                </Link>
              )
            ))}
          </div>
        )}
      </header>
    </>
  );
}
