import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { CategoryCardSkeleton } from "../../components/common/Skeleton.jsx";

// Import Swiper core styles
import "swiper/css";
import "swiper/css/pagination";

export default function Categories() {
  const navigate = useNavigate();
  const { data: dbCategories = [], isLoading: isLoadingCategories } = useCategoriesQuery();
  const { data: dbProducts = [], isLoading: isLoadingProducts } = useProductsQuery();

  const isLoading = isLoadingCategories || isLoadingProducts;

  const displayCategories = useMemo(() => {
    if (!Array.isArray(dbCategories) || dbCategories.length === 0) return [];

    const rootCats = dbCategories.filter((c) => !c.parentId);

    return rootCats.map((root) => {
      // Find count of products in this root category or its subcategories
      const rootProds = (Array.isArray(dbProducts) ? dbProducts : []).filter((p) => {
        const catName = (p.categoryName || p.category?.name || "").toLowerCase();
        return catName === root.name.toLowerCase();
      });

      // Find children subcategories count
      const childCount = dbCategories.filter((c) => c.parentId === root.id).length;

      const representativeImg =
        (rootProds[0]?.imageUrls && rootProds[0].imageUrls[0]) ||
        rootProds[0]?.imageUrl ||
        root.imageUrl ||
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";

      return {
        id: root.id,
        name: root.name,
        image: representativeImg,
        productCount: rootProds.length,
        childCount,
      };
    }).sort((a, b) => {
      const aIsSaree = (a.name || "").toLowerCase().includes("saree");
      const bIsSaree = (b.name || "").toLowerCase().includes("saree");
      if (aIsSaree && !bIsSaree) return -1;
      if (!aIsSaree && bIsSaree) return 1;
      return 0;
    });
  }, [dbCategories, dbProducts]);

  function handleCategoryClick(catName) {
    navigate(`/shop?category=${encodeURIComponent(catName)}`);
  }

  return (
    <section className="pt-10 sm:pt-14 md:pt-16 pb-6 sm:pb-8 md:pb-10 bg-[#FAF7F2] border-y border-[#E6DFD3]/80 relative overflow-hidden">
      {/* Decorative luxury background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-[#800020]/5 to-transparent pointer-events-none blur-2xl" />

      <div className="max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1800px] 4k:max-w-[2200px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12 w-full">
        {/* Left-Aligned Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800020]/10 text-[#800020] text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles size={13} className="text-[#800020]" />
              <span>Royal Departments</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Find Your Signature Silhouette
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl font-normal">
              Explore authentic handcrafted handlooms, royal Kundan jewellery, and heritage festive weaves.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm uppercase font-bold tracking-widest text-[#800020] hover:text-[#940026] pb-1 border-b border-[#800020]/40 hover:border-[#800020] transition-colors self-start md:self-end"
          >
            <span>Explore All Silhouettes</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Carousel Content — Max 4 Cards on Big Screen */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : displayCategories.length > 0 ? (
          <div className="relative">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={14}
              slidesPerView={1.2}
              loop={displayCategories.length > 4}
              autoplay={{
                delay: 3200,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              breakpoints={{
                480: {
                  slidesPerView: 2,
                  spaceBetween: 16,
                },
                640: {
                  slidesPerView: 2.5,
                  spaceBetween: 18,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="w-full !pb-8"
            >
              {displayCategories.map((cat) => (
                <SwiperSlide key={cat.id || cat.name} className="h-auto">
                  <div
                    onClick={() => handleCategoryClick(cat.name)}
                    className="group relative aspect-[3/4] rounded-sm overflow-hidden cursor-pointer bg-white border border-[#E6DFD3] shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end isolate"
                  >
                    {/* Background Image with Smooth Ken-Burns Zoom */}
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

                    {/* Decorative Border Ring */}
                    <div className="absolute inset-2 border border-white/20 rounded-xs pointer-events-none group-hover:border-amber-300/40 transition-colors duration-500" />

                    {/* Top Floating Badge */}
                    {cat.childCount > 0 && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {cat.childCount} {cat.childCount === 1 ? "Collection" : "Collections"}
                        </span>
                      </div>
                    )}

                    {/* Bottom Content Card */}
                    <div className="relative z-10 p-4 sm:p-5 text-white space-y-1 transform transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
                        {cat.name}
                      </h3>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-semibold text-amber-300/90 flex items-center gap-1 group-hover:text-white transition-colors">
                          <span>Explore</span>
                          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : null}
      </div>
    </section>
  );
}