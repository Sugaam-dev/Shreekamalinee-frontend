import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import SubcategoryCard from "../../components/cards/SubcategoryCard.jsx";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export default function CategoryCarousel({ cat }) {
  const subcats = cat.subcatProducts || [];
  const N = subcats.length;

  if (N === 0) return null;

  return (
    <div className="mb-12 relative group/carousel">
      <h3 className="font-serif font-semibold text-2xl text-charcoal tracking-wide mb-6">
        {cat.name}
      </h3>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={14}
        slidesPerView={1.5}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
        }}
        loop={N > 4}
        breakpoints={{
          480: {
            slidesPerView: 2,
            spaceBetween: 14,
          },
          640: {
            slidesPerView: 2.5,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3.2,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 18,
          },
          1280: {
            slidesPerView: 4.5,
            spaceBetween: 20,
          },
        }}
        className="w-full pb-8"
      >
        {subcats.map((sp) => {
          const isAllSoldOut = sp.products?.length > 0 && sp.products.every((p) => p.isSoldOut);
          return (
            <SwiperSlide key={sp.subcat}>
              <SubcategoryCard
                catName={cat.name}
                subcatName={sp.subcat}
                image={sp.image || sp.products?.[0]?.image || ""}
                isSoldOut={Boolean(isAllSoldOut)}
              />
            </SwiperSlide>
          );
        })}

      </Swiper>
    </div>
  );
}
