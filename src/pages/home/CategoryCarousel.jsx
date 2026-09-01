import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { ArrowUpRight } from "lucide-react";
import SubcategoryCard from "../../components/cards/SubcategoryCard.jsx";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export default function CategoryCarousel({ cat }) {
  const subcats = cat.subcatProducts || [];
  const N = subcats.length;

  if (N === 0) return null;

  return (
    <div className="mb-8 sm:mb-12 relative group/carousel">
      {/* Category Sub-Header with Luxury Accent (Standard Left-Aligned) */}
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 pb-3 border-b border-[#E6DFD3]/80">
        <div className="flex items-baseline gap-3">
          <h3 className="font-serif font-bold text-xl sm:text-2xl md:text-3xl text-gray-900 tracking-tight">
            {cat.name}
          </h3>
          <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
            ({N} {N === 1 ? "Collection" : "Collections"})
          </span>
        </div>

        <Link
          to={`/shop?category=${encodeURIComponent(cat.name)}`}
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs uppercase font-bold tracking-widest text-[#800020] hover:text-[#940026] transition-colors"
        >
          <span>View All</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Auto-Scrolling Fluid Subcategories Swiper Carousel — Max 4 Cards on Big Screen */}
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={14}
        slidesPerView={1.2}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        loop={N > 4}
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
        {subcats.map((sp) => {
          const isAllSoldOut = sp.products?.length > 0 && sp.products.every((p) => p.isSoldOut);
          return (
            <SwiperSlide key={sp.subcat} className="h-auto">
              <SubcategoryCard
                catName={cat.name}
                subcatName={sp.subcat}
                image={sp.image || sp.products?.[0]?.image || ""}
                itemCount={sp.products?.length || 0}
                isSoldOut={Boolean(isAllSoldOut)}
              />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
