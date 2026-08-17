import { FaInstagram, FaFacebookF } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { CiYoutube } from "react-icons/ci";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  const collectionLinks = [
    { label: "Sarees", path: "/product?category=Sarees" },
    { label: "Dress Material", path: "/product?category=Dress%20Material" },
    { label: "Readymade", path: "/product?category=Readymade" },
    { label: "Accessories", path: "/product?category=Accessories" },
  ];

  const quickLinks = [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "All Products", path: "/product" },
    { label: "Contact Us", path: "/contact" },
  ];

  return (
    <footer className="pt-14 pb-8 bg-cream border-t border-line">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] gap-10 md:gap-16 mb-12">
          
          {/* Brand Info & Logo Column */}
          <div className="space-y-4">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <img
                src="/shreekamalineeLogo.png"
                alt="Shreekamalinee Logo"
                className="h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-[13.5px] text-charcoal/65 leading-relaxed max-w-sm">
              Hand-woven Paithani & Maheshwari sarees, pure Ikat & Jamdani dress materials, 
              ready-to-wear silhouettes, and handcrafted ethnic accessories.
            </p>
            <div className="pt-1 space-y-2 text-[13px] text-charcoal/70">
              <div className="flex items-center gap-2.5">
                <MapPin size={15} className="text-rust shrink-0" />
                <span>Maharashtra, India</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-rust shrink-0" />
                <span>support@shreekamalinee.com</span>
              </div>
            </div>
          </div>

          {/* Real Category Links */}
          <div>
            <h4 className="text-[12.5px] tracking-[0.14em] uppercase font-bold text-charcoal mb-4 border-b border-rust/20 pb-2 w-fit">
              Categories
            </h4>
            <ul className="space-y-2.5">
              {collectionLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.path}
                    className="text-[13.5px] text-charcoal/65 hover:text-rust transition-colors block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Page Links */}
          <div>
            <h4 className="text-[12.5px] tracking-[0.14em] uppercase font-bold text-charcoal mb-4 border-b border-rust/20 pb-2 w-fit">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.path}
                    className="text-[13.5px] text-charcoal/65 hover:text-rust transition-colors block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Social Media */}
        <div className="flex justify-between items-center flex-wrap gap-4 text-[12.5px] text-charcoal/50 pt-6 border-t border-line">
          <span>
            © 2026 Shreekamalinee. Powered by{" "}
            <a
              href="https://www.pmrgsolution.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rust underline transition-colors font-semibold text-charcoal/80"
            >
              PMRG Solution
            </a>. All rights reserved.
          </span>
          <div className="flex gap-3">
            {[
              { icon: <FaInstagram size={14} />, label: "Instagram", url: "https://instagram.com" },
              { icon: <FaFacebookF size={14} />, label: "Facebook", url: "https://facebook.com" },
              { icon: <CiYoutube size={16} />, label: "YouTube", url: "https://youtube.com" }
            ].map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 border border-line rounded-full flex items-center justify-center text-charcoal hover:bg-rust hover:text-white hover:border-rust transition-all duration-300 shadow-xs"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
