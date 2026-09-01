import { Link } from "react-router-dom";

export default function SubcategoryCard({ catName, subcatName, image, itemCount, isSoldOut }) {
  return (
    <div className="group w-full h-full">
      <Link
        to={`/shop?category=${encodeURIComponent(catName)}&subcat=${encodeURIComponent(subcatName)}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-sm bg-white border border-[#E6DFD3] shadow-xs hover:shadow-xl transition-all duration-500 isolate"
      >
        {/* Sold Out or Special Status Badge */}
        {isSoldOut ? (
          <span className="absolute top-3 left-3 z-10 text-[9px] tracking-[0.15em] font-bold uppercase px-2.5 py-1 text-white bg-[#800020] shadow-xs rounded-xs">
            Sold Out
          </span>
        ) : itemCount > 0 ? (
          <span className="absolute top-3 left-3 z-10 text-[9px] tracking-[0.15em] font-bold uppercase px-2.5 py-1 text-gray-900 bg-white/90 backdrop-blur-md shadow-xs rounded-full border border-gray-100">
            {itemCount} {itemCount === 1 ? "Creation" : "Creations"}
          </span>
        ) : null}

        {/* Product Image */}
        <img
          src={image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"}
          alt={subcatName}
          loading="lazy"
          className={`w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 ${
            isSoldOut ? "opacity-75 grayscale-[30%]" : ""
          }`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

        {/* Decorative Inner Border */}
        <div className="absolute inset-2 border border-white/20 rounded-xs pointer-events-none group-hover:border-amber-300/40 transition-colors duration-500" />

        {/* Bottom Content Pill */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-4.5 text-white transform transition-transform duration-300 group-hover:-translate-y-1">
          <div className="font-serif text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors line-clamp-1">
            {subcatName}
          </div>
          <span className="block text-[10px] sm:text-[10.5px] tracking-[0.15em] uppercase opacity-90 font-medium mt-1 text-amber-200 group-hover:text-white transition-colors">
            {isSoldOut ? "Sold Out →" : "Explore Collection →"}
          </span>
        </div>
      </Link>
    </div>
  );
}
