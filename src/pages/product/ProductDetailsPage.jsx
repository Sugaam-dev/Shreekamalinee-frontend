import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Heart } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { PRODUCTS } from "../../data/products/products.js";
import ProductCard from "../../components/cards/ProductCard.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWish, wishlist } = useCart();
  
  const product = PRODUCTS.find((p) => p.id === parseInt(id));
  const isWished = product ? wishlist.has(product.id) : false;

  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(product?.defaultSize || "");
  const [selectedImage, setSelectedImage] = useState(product?.image || "");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setSelectedColor(product.colors?.[0] || "");
      setSelectedSize(product.defaultSize || "");
    }
  }, [product]);

  useSEO({
    title: product ? `${product.name} - ${product.cat}` : "Product Details",
    description: product 
      ? `Buy ${product.name} in category ${product.cat}. ${product.aboutThisItem ? product.aboutThisItem.join(' ') : "Premium quality traditional attire at Shreekamalinee."}`
      : "View premium handcrafted heritage fashion items at Shreekamalinee.",
    image: product ? product.image : "/shreekamalineeLogo.png",
    schema: product ? {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [
        product.image,
        ...(product.images || [])
      ],
      "description": product.aboutThisItem ? product.aboutThisItem.join(' ') : product.name,
      "sku": `SK-${product.id}`,
      "mpn": `MPN-${product.id}`,
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": product.price,
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.isSoldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Shreekamalinee"
        }
      }
    } : null
  });

  if (!product) {
    return (
      <div className="bg-cream min-h-screen py-16 text-center text-charcoal/50">
        Product not found.
      </div>
    );
  }

  // Filter related products
  const relatedProducts = PRODUCTS.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  function handleAddToBag() {
    if (product.isSoldOut) {
      alert("Sorry, this item is currently sold out.");
      return;
    }
    const options = [];
    if (product.sizes && product.sizes.length > 0) {
      if (!selectedSize) {
        alert("Please select a size option before adding to bag.");
        return;
      }
      options.push(selectedSize);
    }

    const nameSuffix = options.length > 0 ? ` (${options.join(" · ")})` : "";

    const productWithOpts = {
      ...product,
      name: `${product.name}${nameSuffix}`,
      price: product.price,
    };
    
    for (let i = 0; i < qty; i++) {
      addToCart(productWithOpts);
    }
  }

  return (
    <div className="bg-cream min-h-screen">
      {/* Back button link */}
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] tracking-widest uppercase font-semibold text-charcoal/60 hover:text-rust transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} className="stroke-[2.2]" />
          <span>Back to Collections</span>
        </button>
      </div>

      {/* Main Details Panel */}
      <main className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10 pb-16 md:pb-24 grid md:grid-cols-2 gap-10 md:gap-16">
        {/* Left Column: Product Image & Gallery */}
        <div className="flex flex-col md:flex-row gap-4 h-fit">
          {/* Thumbnail column/row */}
          {product.images && product.images.length > 1 && (
            <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[90px] md:max-h-[600px] no-scrollbar w-full md:w-24 shrink-0 pb-2 md:pb-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 md:w-full md:h-28 rounded-sm overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    selectedImage === img ? "border-rust shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} View ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Main Display Image */}
          <div className="order-1 md:order-2 flex-1 flex items-center justify-center w-full">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="max-h-[450px] md:max-h-[550px] w-auto h-auto object-contain rounded-sm shadow-sm border border-line transition-all duration-300"
            />
          </div>
        </div>

        {/* Right Column: Info & Details */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="block text-[11px] text-rust uppercase tracking-[0.2em] font-semibold">
                 {product.cat}{product.subcat ? ` · ${product.subcat}` : ''} · {product.season}
              </span>
              {product.isSoldOut ? (
                <span className="text-[10px] uppercase font-bold tracking-widest text-white bg-rust-deep px-2.5 py-0.5 rounded-xs">
                  Sold Out
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-xs border border-emerald-200">
                  In Stock
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-semibold mb-4 leading-tight text-charcoal">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-2xl md:text-3xl font-bold text-charcoal">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.mrp && (
                <span className="text-base text-charcoal/30 line-through">
                  ₹{product.mrp.toLocaleString("en-IN")}
                </span>
              )}
              {product.mrp && (
                <span className="text-xs font-semibold text-rust bg-rust/10 px-2 py-0.5 rounded-sm">
                  Save {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
                </span>
              )}
            </div>

            {/* Colors */}
            <div className="mb-6 pb-6 border-b border-line">
              <span className="block text-xs uppercase tracking-widest text-charcoal/50 mb-3 font-semibold">
                Select Color Option
              </span>
              <div className="flex gap-3">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                      selectedColor === c ? "border-rust scale-110 shadow-md" : "border-black/5"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

{/* Sizes */}
{product.sizes && product.sizes.length > 0 && (
  <div className="mb-6 pb-6 border-b border-line">
    <div className="flex justify-between items-baseline mb-3">
      <span className="text-xs uppercase tracking-widest text-charcoal/50 font-semibold">
        Select Size Option
      </span>
      <button
        onClick={() => showToast("Size Guide: S (36\"), M (38\"), L (40\"), XL (42\"), XXL (44\")")}
        className="text-[11px] text-rust underline hover:text-rust-deep cursor-pointer font-medium"
      >
        Size Guide
      </button>
    </div>
    <div className="flex flex-wrap gap-2.5">
      {product.sizes.map((sz) => (
        <button
          key={sz}
          onClick={() => setSelectedSize(sz)}
          className={`w-12 h-10 border text-xs tracking-widest font-semibold flex items-center justify-center transition-all cursor-pointer ${
            selectedSize === sz
              ? "bg-charcoal text-cream border-charcoal shadow-sm"
              : "border-line text-charcoal/60 hover:border-charcoal bg-white"
          }`}
        >
          {sz}
        </button>
      ))}
    </div>
  </div>
)}

            {/* Product Details Section */}
            {product.highlights && Object.keys(product.highlights).length > 0 && (
              <div className="mt-8 pt-8 border-t border-line mb-8">
                <h2 className="font-serif text-xl font-semibold text-charcoal mb-5">Product Details</h2>
                
                <div className="mb-6">
                  <h3 className="text-[11px] uppercase tracking-widest text-charcoal/40 font-bold mb-3.5">
                    Top Highlights
                  </h3>
                  <div className="grid grid-cols-1 gap-y-2.5">
                    {Object.entries(product.highlights).map(([key, value]) => (
                      <div key={key} className="flex border-b border-line/30 pb-2 text-[13.5px] leading-relaxed">
                        <span className="w-5/12 font-semibold text-charcoal">{key}</span>
                        <span className="w-7/12 text-charcoal/60">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {product.aboutThisItem && product.aboutThisItem.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-[11px] uppercase tracking-widest text-charcoal/40 font-bold mb-3.5">
                      About This Item
                    </h3>
                    <ul className="list-disc pl-4 space-y-2 text-[13.5px] text-charcoal/60 leading-relaxed">
                      {product.aboutThisItem.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add to cart block */}
          <div className="flex gap-4 items-center pt-2">
            <div className={`flex items-center border border-line bg-white h-12 ${product.isSoldOut ? "opacity-40 pointer-events-none" : ""}`}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={product.isSoldOut}
                className="w-10 h-full flex items-center justify-center cursor-pointer hover:bg-cream-2/30 transition-colors"
                title="Decrease quantity"
              >
                <Minus size={14} className="stroke-[2.2]" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                disabled={product.isSoldOut}
                className="w-10 h-full flex items-center justify-center cursor-pointer hover:bg-cream-2/30 transition-colors"
                title="Increase quantity"
              >
                <Plus size={14} className="stroke-[2.2]" />
              </button>
            </div>

            <button
              onClick={handleAddToBag}
              disabled={product.isSoldOut}
              className={`flex-grow h-12 text-[12.5px] tracking-[0.18em] uppercase font-bold transition-all duration-300 shadow-md ${
                product.isSoldOut
                  ? "bg-charcoal/30 text-white/70 cursor-not-allowed shadow-none"
                  : "bg-rust hover:bg-rust-deep text-white cursor-pointer"
              }`}
            >
              {product.isSoldOut ? "Sold Out" : "Add To Bag"}
            </button>

            <button
              onClick={() => toggleWish(product.id)}
              className="h-12 w-12 border border-line bg-white hover:bg-cream-2/30 flex items-center justify-center cursor-pointer transition-colors shadow-xs"
              title={isWished ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={20} className={isWished ? "fill-rust text-rust stroke-[2.2]" : "text-charcoal stroke-[1.8]"} />
            </button>
          </div>
        </div>
      </main>

      {/* Description / Story blocks */}
      <section className="bg-cream-2/40 border-t border-b border-line py-16">
        <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10 grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-serif text-[18px] font-semibold mb-3">Artisan Craftsmanship</h4>
            <p className="text-[13.5px] leading-relaxed text-charcoal/60">
              Each piece is meticulously crafted by handloom weavers using premium slubs and silk blends, ensuring 
              unmatched comfort and durability.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-[18px] font-semibold mb-3">Sizing & Stylist Assistance</h4>
            <p className="text-[13.5px] leading-relaxed text-charcoal/60">
              Have questions about fabric care, fits, or styling? 
              Contact us on WhatsApp for complimentary assistance and general inquiries.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-[18px] font-semibold mb-3">Product Care Details</h4>
            <p className="text-[13.5px] leading-relaxed text-charcoal/60">
              Dry clean only. Iron inside out on moderate steam settings. Store in a cool, dry place wrapped 
              in muslin fabric.
            </p>
          </div>
        </div>
      </section>

      {/* Related items */}
      {relatedProducts.length > 0 && (
        <section className="py-16 md:py-24 max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
          <h3 className="font-serif text-2xl font-semibold mb-10 text-center">You May Also Like</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
