import { Link } from "react-router-dom";

export default function SubcategoryCard({ catName, subcatName, image, isSoldOut }) {
  return (
    <div className="group w-full">
      <Link
        to={`/shop?category=${encodeURIComponent(catName)}&subcat=${encodeURIComponent(subcatName)}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-sm shadow-sm"
      >

        {isSoldOut && (
          <span className="absolute top-3 left-3 z-10 text-[9px] tracking-[0.15em] font-bold uppercase px-2.5 py-1 text-white bg-rust-deep shadow-xs rounded-xs">
            Sold Out
          </span>
        )}
        <img
          src={image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"}
          alt={subcatName}
          loading="lazy"
          className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
            isSoldOut ? "opacity-80 grayscale-[25%]" : ""
          }`}

          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80`;
          }}
        />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/55 to-transparent text-white">
          <div className="font-serif text-[15px] font-semibold">{subcatName}</div>
          <span className="block text-[9px] tracking-[0.12em] uppercase opacity-85 font-sans font-light mt-0.5">
            {isSoldOut ? "View Collection (Sold Out) →" : "Explore Collection →"}
          </span>
        </div>
      </Link>
    </div>
  );
}
