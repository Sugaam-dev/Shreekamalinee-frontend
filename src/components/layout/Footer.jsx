import { FaInstagram, FaFacebookF } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { CiYoutube } from "react-icons/ci";
import { Mail, MapPin, Phone, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";

export default function Footer() {
  const { data: settings } = useBankDetailsQuery();

  const freeShippingThreshold = settings?.freeShippingThreshold != null ? settings.freeShippingThreshold : 1499;
  const contactPhone = settings?.whatsappNumber || settings?.contactPhone || "+91 9820785210";
  const contactEmail = settings?.supportEmail || settings?.contactEmail || "support@shreekamalinee.com";
  const contactAddress = settings?.contactAddress || "Shreekamalinee Studio, Atelier Heritage Lane, Varanasi, Uttar Pradesh, India";

  const collectionLinks = [
    { label: "Handwoven Sarees", path: "/shop?category=Sarees" },
    { label: "Unstitched Suit Material", path: "/shop?category=Dress%20Material" },
    { label: "Readymade Silhouettes", path: "/shop?category=Readymade" },
    { label: "Ethnic Accessories", path: "/shop?category=Accessories" },
  ];

  const customerLinks = [
    { label: "My Account", path: "/account/profile" },
    { label: "Order History & Tracking", path: "/account/orders" },
    { label: "Shipping & Delivery", path: "/shipping-returns" },
    { label: "Returns & Exchanges", path: "/shipping-returns" },
    { label: "Frequently Asked Questions", path: "/faq" },
  ];

  const brandLinks = [
    { label: "Our Artisanal Story", path: "/about" },
    { label: "Contact & Studio", path: "/contact" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
  ];

  return (
    <footer className="pt-12 sm:pt-16 pb-8 bg-cream-2/70 border-t border-line">
      {/* Top Value Badges */}
      <div className="max-w-[1280px] 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12 mb-10 sm:mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-line rounded-sm shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rust/10 flex items-center justify-center text-rust shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="font-serif font-bold text-sm text-charcoal">100% Handloom</h5>
              <p className="text-[11px] text-charcoal/55">Authentic artisan weaving</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rust/10 flex items-center justify-center text-rust shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h5 className="font-serif font-bold text-sm text-charcoal">Free Shipping</h5>
              <p className="text-[11px] text-charcoal/55">On all orders over ₹{freeShippingThreshold.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rust/10 flex items-center justify-center text-rust shrink-0">
              <RefreshCw size={20} />
            </div>
            <div>
              <h5 className="font-serif font-bold text-sm text-charcoal">Hassle-Free Returns</h5>
              <p className="text-[11px] text-charcoal/55">7-day replacement guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rust/10 flex items-center justify-center text-rust shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <h5 className="font-serif font-bold text-sm text-charcoal">Dedicated Support</h5>
              <p className="text-[11px] text-charcoal/55">{contactPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1280px] 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-line">
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="font-serif text-2xl tracking-[0.2em] font-bold text-charcoal uppercase block">
            Shree Kamalinee
          </Link>
          <p className="text-xs text-charcoal/70 leading-relaxed max-w-sm">
            Curating India&apos;s finest handwoven silks and artisanal textiles. Celebrating traditional craftsmanship with timeless silhouettes.
          </p>
          <div className="space-y-2 pt-2 text-xs text-charcoal/70">
            <div className="flex items-center gap-2.5">
              <Phone size={14} className="text-rust shrink-0" />
              <span>{contactPhone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={14} className="text-rust shrink-0" />
              <span>{contactEmail}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={14} className="text-rust shrink-0 mt-0.5" />
              <span>{contactAddress}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-charcoal mb-4">Collections</h4>
          <ul className="space-y-2.5 text-xs text-charcoal/70">
            {collectionLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="hover:text-rust transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-charcoal mb-4">Customer Care</h4>
          <ul className="space-y-2.5 text-xs text-charcoal/70">
            {customerLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.path} className="hover:text-rust transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-charcoal mb-4">The Brand</h4>
          <ul className="space-y-2.5 text-xs text-charcoal/70">
            {brandLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="hover:text-rust transition-colors">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1280px] 2xl:max-w-[1600px] 3xl:max-w-[2000px] 4k:max-w-[2400px] mx-auto px-4 sm:px-6 md:px-10 2xl:px-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal/60">
        <p>© {new Date().getFullYear()} Shree Kamalinee. All rights reserved.</p>
        <div className="flex items-center gap-4 text-base text-charcoal/70">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-rust"><FaInstagram /></a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-rust"><FaFacebookF /></a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-rust"><CiYoutube /></a>
        </div>
      </div>
    </footer>
  );
}