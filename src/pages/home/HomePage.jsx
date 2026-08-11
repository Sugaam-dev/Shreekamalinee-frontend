import { Link } from "react-router-dom";
import CategoryCarousel from "./CategoryCarousel";
import Hero from "./Hero.jsx";
import Marquee from "../../components/ui/Marquee.jsx";
import Categories from "./Categories.jsx";
import Story from "./Story.jsx";
// import Newsletter from "./Newsletter.jsx";
import ProductCard from "../../components/cards/ProductCard.jsx";
import SubcategoryCard from "../../components/cards/SubcategoryCard.jsx";
import { PRODUCTS, COLLECTION_CATEGORIES } from "../../data/products/products.js";
import useSEO from "../../hooks/useSEO.js";

export default function HomePage() {
  const featuredProducts = PRODUCTS.filter((p) => p.tag === "Bestseller" || p.tag === "New" || p.tag === "Premium").slice(0, 8);

  useSEO({
    title: "Home",
    description: "Discover curated hand-woven sarees, royal Kundan jewellery, and designer unstitched dress materials crafted for royal elegance at Shreekamalinee.",
    schema: {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": "Shreekamalinee",
      "image": "https://shreekamalinee.com/shreekamalineeLogo.png",
      "@id": "https://shreekamalinee.com/#organization",
      "url": "https://shreekamalinee.com",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      }
    }
  });

  const reviews = [
    {
      name: "Ananya Sharma",
      quote: "The slub silk saree is drop-dead gorgeous. The premium handloom weave fits and drapes perfectly. Shreekamalinee has a client for life!",
      avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&w=150&h=150&q=80",
      item: "Meera Slub Silk Saree"
    },
    {
      name: "Priyanka Patel",
      quote: "Obsessed with the Kundan choker set! Handcrafted beautifully, and it came in premium packaging. Stunning designs.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
      item: "Aura Kundan Choker"
    },
    {
      name: "Sneha Reddy",
      quote: "Excellent direct communication on WhatsApp for sizing queries. The clutch bag matches my festive outfit flawlessly.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80",
      item: "Embroidered Potli Bag"
    }
  ];

  // Build collection data grouping products by category and subcategory
  const collectionData = COLLECTION_CATEGORIES.map((cat) => ({
    ...cat,
    subcatProducts: cat.subcats.map((subcat) => ({
      subcat,
      products: PRODUCTS.filter((p) => {
        const catNameMatch = cat.name === "Accessories"
          ? (p.cat === "Women Accessories" || p.cat === "Accessories")
          : p.cat === cat.name;
        return catNameMatch && p.subcat === subcat;
      }).slice(0, 4)
    }))
  }));

  return (
    <div>
      <h1 className="sr-only">Shreekamalinee | Elegant Indian Heritage Sarees, Jewellery & Accessories</h1>
      <Hero />
      <Marquee />
      <Categories />

       {/* Featured Collection grouped by subcategory */}
       <section className="py-16 md:py-24 bg-cream">
         <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
           <div className="flex justify-between items-end flex-wrap gap-5 mb-12">
             <div>
               <span className="block text-xs tracking-[0.2em] uppercase text-rust mb-2 font-semibold">
                 Curated Collection
               </span>
               <h2 className="font-serif font-medium text-3xl md:text-5xl text-charcoal mb-2">Loved This Season</h2>
               <p className="text-sm text-charcoal/50 font-normal">Hand-woven sarees, royal kundan jewellery, and premium heritage accessories.</p>
             </div>
             <Link
               to="/product"
               className="text-[13px] tracking-widest uppercase border-b border-charcoal pb-0.5 font-bold hover:text-rust hover:border-rust transition-colors cursor-pointer"
             >
               View All Products →
             </Link>
           </div>

           {collectionData.map((cat) => (
            <CategoryCarousel key={cat.name} cat={cat} />
          ))}
         </div>
       </section>

      <Story />

      {/* Testimonials Section (PMRG Divas Reviews) */}
      <section className="py-16 md:py-24 bg-cream border-t border-line">
        <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs tracking-[0.22em] uppercase text-rust font-semibold block mb-3">
              #ShreekamalineeDivas Speaks
            </span>
            <h2 className="font-serif font-medium text-3xl md:text-5xl text-charcoal">
              Loved by Elegant Women
            </h2>
            <div className="w-12 h-0.5 bg-rust mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((rev, i) => (
              <div key={i} className="bg-cream-2/40 p-8 rounded-sm border border-line flex flex-col justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <div className="text-rust text-xl mb-4">★★★★★</div>
                  <p className="text-[14px] leading-relaxed text-charcoal/70 italic mb-6">
                    "{rev.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-4 border-t border-line/55 pt-4">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="w-11 h-11 rounded-full object-cover shadow-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-charcoal">{rev.name}</h4>
                    <span className="text-[11px] text-charcoal/40 font-medium uppercase tracking-wide">
                      Verified Buyer · {rev.item}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
