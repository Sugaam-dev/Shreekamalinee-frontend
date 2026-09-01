import { useMemo } from "react";
import { Link } from "react-router-dom";
import CategoryCarousel from "./CategoryCarousel";
import Hero from "./Hero.jsx";
import Marquee from "../../components/ui/Marquee.jsx";
import Categories from "./Categories.jsx";
import Story from "./Story.jsx";
import ProductCard from "../../components/cards/ProductCard.jsx";
import { ProductCardSkeleton } from "../../components/common/Skeleton.jsx";
import { useProductsQuery } from "../../queries/useProductQueries.js";
import { useCategoriesQuery } from "../../queries/useCategoryQueries.js";
import useSEO from "../../hooks/useSEO.js";

export default function HomePage() {
  const { data: dbCategories = [], isLoading: isLoadingCategories } = useCategoriesQuery();
  const { data: dbProducts = [], isLoading: isLoadingProducts } = useProductsQuery();

  const isLoading = isLoadingCategories || isLoadingProducts;
  const featuredProducts = Array.isArray(dbProducts) ? dbProducts.slice(0, 8) : [];

  useSEO({
    title: "Home",
    description:
      "Discover curated hand-woven sarees, royal Kundan jewellery, and designer unstitched dress materials crafted for royal elegance at Shreekamalinee.",
    schema: {
      "@context": "https://schema.org",
      "@type": "Store",
      name: "Shreekamalinee",
      image: "https://shreekamalinee.com/shreekamalineeLogo.png",
      "@id": "https://shreekamalinee.com/#organization",
      url: "https://shreekamalinee.com",
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
    },
  });

  const reviews = [
    {
      name: "Ananya Sharma",
      quote:
        "The slub silk saree is drop-dead gorgeous. The premium handloom weave fits and drapes perfectly. Shreekamalinee has a client for life!",
      avatar:
        "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&w=150&h=150&q=80",
      item: "Meera Slub Silk Saree",
    },
    {
      name: "Priyanka Patel",
      quote:
        "Obsessed with the Kundan choker set! Handcrafted beautifully, and it came in premium packaging. Stunning designs.",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
      item: "Aura Kundan Choker",
    },
    {
      name: "Sneha Reddy",
      quote:
        "Excellent direct communication on WhatsApp for sizing queries. The clutch bag matches my festive outfit flawlessly.",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80",
      item: "Embroidered Potli Bag",
    },
  ];

  // Dynamically build collection data grouping live products by category and subcategory purely from DB
  const collectionData = useMemo(() => {
    if (!Array.isArray(dbCategories) || dbCategories.length === 0) return [];

    const rootCats = dbCategories.filter((c) => !c.parentId);

    return rootCats.map((cat) => {
      const dbChildren = dbCategories.filter((c) => c.parentId === cat.id);
      const subcatList = dbChildren.length > 0
        ? dbChildren.map((ch) => ({ name: ch.name, image: ch.imageUrl || cat.imageUrl || null }))
        : [{ name: cat.name, image: cat.imageUrl || null }];

      const subcatProducts = subcatList.map((sub) => {
        const prods = (Array.isArray(dbProducts) ? dbProducts : []).filter((p) => {
          const catName = p.categoryName || p.category?.name || "";
          const subcatName = p.subCategoryName || p.subCategory?.name || "";
          const catMatch = catName.toLowerCase() === cat.name.toLowerCase();
          const subMatch =
            sub.name === cat.name ||
            subcatName.toLowerCase() === sub.name.toLowerCase();
          return catMatch && subMatch;
        });

        const representativeImg =
          (prods[0]?.imageUrls && prods[0].imageUrls[0]) ||
          prods[0]?.imageUrl ||
          sub.image ||
          cat.imageUrl ||
          "/images/placeholder-saree.jpg";

        return {
          subcat: sub.name,
          image: representativeImg,
          products: prods.map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.offerPrice || p.price || 0),
            image: (Array.isArray(p.imageUrls) && p.imageUrls[0]) || p.imageUrl || representativeImg,
            isSoldOut: p.inStock === false,
          })),
        };
      }).sort((a, b) => {
        const aIsSaree = (a.subcat || "").toLowerCase().includes("saree");
        const bIsSaree = (b.subcat || "").toLowerCase().includes("saree");
        if (aIsSaree && !bIsSaree) return -1;
        if (!aIsSaree && bIsSaree) return 1;
        return 0;
      });

      return {
        id: cat.id || cat.name,
        name: cat.name,
        subcatProducts,
      };
    }).sort((a, b) => {
      const aIsSaree = (a.name || "").toLowerCase().includes("saree");
      const bIsSaree = (b.name || "").toLowerCase().includes("saree");
      if (aIsSaree && !bIsSaree) return -1;
      if (!aIsSaree && bIsSaree) return 1;
      return 0;
    });
  }, [dbCategories, dbProducts]);

  return (
    <div>
      <h1 className="sr-only">Shreekamalinee | Elegant Indian Heritage Sarees, Jewellery & Accessories</h1>
      <Hero />
      <Marquee />
      <Categories />

      {/* Featured Collection grouped by subcategory */}
      <section className="pt-8 sm:pt-10 md:pt-12 pb-4 sm:pb-6 md:pb-8 bg-[#FAF7F2]/40">
        <div className="max-w-[1440px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] 4k:max-w-[2800px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-16 w-full">
          <div className="flex justify-between items-end flex-wrap gap-5 mb-8 sm:mb-12">
            <div>
              <span className="block text-xs tracking-[0.2em] uppercase text-rust mb-2 font-semibold">
                Curated Collection
              </span>
              <h2 className="font-serif font-medium text-2xl sm:text-3xl md:text-5xl text-charcoal mb-2">Loved This Season</h2>
              <p className="text-xs sm:text-sm text-charcoal/50 font-normal">
                Hand-woven sarees, royal kundan jewellery, and premium heritage accessories.
              </p>
            </div>
            <Link
              to="/shop"
              className="text-[12px] sm:text-[13px] tracking-widest uppercase border-b border-charcoal pb-0.5 font-bold hover:text-rust hover:border-rust transition-colors cursor-pointer"
            >
              View All Products →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : collectionData.length > 0 ? (
            collectionData.map((cat) => <CategoryCarousel key={cat.name} cat={cat} />)
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Story />

      {/* Testimonials Section (PMRG Divas Reviews) */}
      <section className="py-12 sm:py-16 md:py-24 bg-cream border-t border-line">
        <div className="max-w-[1400px] 2xl:max-w-[1750px] 3xl:max-w-[2100px] 4k:max-w-[2560px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12 w-full">
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
                <div className="border-t border-line/55 pt-4">
                  <h4 className="text-sm font-bold text-charcoal">{rev.name}</h4>
                  <span className="text-[11px] text-charcoal/45 font-medium uppercase tracking-wide block mt-0.5">
                    Verified Patron · {rev.item}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}