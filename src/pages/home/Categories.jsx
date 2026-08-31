import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import { CategoryCardSkeleton } from "../../components/common/Skeleton.jsx";

export default function Categories() {
  const navigate = useNavigate();
  const { data: dbCategories = [], isLoading } = useCategoriesQuery();

  const displayCategories = useMemo(() => {
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      const rootCats = dbCategories.filter((c) => !c.parentId);
      return rootCats.map((root) => ({
        id: root.id,
        name: root.name,
        image: root.imageUrl || "/images/placeholder-saree.jpg",
      }));
    }
    return [];
  }, [dbCategories]);

  function handleCategoryClick(catName) {
    navigate(`/shop?category=${encodeURIComponent(catName)}`);
  }

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2]/60">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10 space-y-12">
        <div>
          <span className="block text-xs tracking-[0.2em] uppercase text-[#800020] mb-2 font-semibold">
            Shop by category
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
            Find Your Signature Silhouette
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))
          ) : displayCategories.length > 0 ? (
            displayCategories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className="relative aspect-[3/4] overflow-hidden cursor-pointer group isolate rounded-xs shadow-xs border border-gray-200"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="font-serif text-base md:text-lg font-bold">{cat.name}</div>
                  <span className="block text-[10px] tracking-[0.15em] uppercase opacity-90 font-medium mt-1 text-amber-200">
                    Explore Collection →
                  </span>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>
    </section>
  );
}