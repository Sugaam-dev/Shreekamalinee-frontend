import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(category.name)}`}
      className="group relative block overflow-hidden rounded-sm bg-cream-2 border border-line shadow-xs hover:shadow-md transition-all duration-500"
    >
      <div className="aspect-[4/5] w-full overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
        />
      </div>

      {/* Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex flex-col justify-end">
        {category.count && (
          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#D6A23F] mb-1">
            {category.count}
          </span>
        )}
        <h3 className="font-serif text-xl md:text-2xl font-bold mb-2 drop-shadow-sm group-hover:text-amber-100 transition-colors">
          {category.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 group-hover:text-rust transition-colors group-hover:translate-x-1 duration-300">
          <span>Explore Collection</span>
          <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  );
}
