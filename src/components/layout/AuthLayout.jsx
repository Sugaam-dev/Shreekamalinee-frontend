import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export default function AuthLayout({ children, title, subtitle, image }) {
  const formCardRef = useRef(null);

  useEffect(() => {
    // Smooth scroll to top / form on mobile when landing or switching auth pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [title]);

  return (
    <div className="bg-cream min-h-screen py-4 sm:py-8 lg:py-16 flex items-center justify-center">
      <div className="max-w-[1100px] w-full mx-auto px-3 sm:px-6 md:px-8">
        <div 
          ref={formCardRef}
          className="bg-white border border-[#E6DFD3] rounded-sm shadow-xl overflow-hidden grid lg:grid-cols-2"
        >
          {/* Left Editorial Heritage Side (Grand on Desktop, Compact on Mobile) */}
          <div className="relative bg-charcoal text-white p-6 sm:p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={image || "/images/auth/auth-heritage-banner.jpg"}
                alt="Shreekamalinee Heritage"
                className="w-full h-full object-cover opacity-35 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/50" />
            </div>

            {/* Top Brand Info */}
            <div className="relative z-10 space-y-3">
              <Link to="/" className="inline-block group">
                <img
                  src="/shreekamalineeLogo.png"
                  alt="Shreekamalinee"
                  className="h-12 sm:h-16 w-auto object-contain brightness-150 drop-shadow-md group-hover:scale-105 transition-transform"
                />
              </Link>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#D6A23F] text-[10px] uppercase font-bold tracking-widest backdrop-blur-sm">
                <Sparkles size={12} />
                <span>The Royal Handloom Legacy</span>
              </div>
            </div>

            {/* Middle Quote (Hidden on very compact mobile, visible on tablet/desktop) */}
            <div className="relative z-10 my-4 sm:my-8 lg:my-14 space-y-2 sm:space-y-3">
              <blockquote className="font-serif text-lg sm:text-2xl lg:text-3xl font-light italic leading-snug text-cream">
                "Where centuries of traditional weaving meet royal contemporary grace."
              </blockquote>
              <p className="text-[11px] sm:text-xs text-cream/70 tracking-wider uppercase">
                Direct from master artisans across Maharashtra
              </p>
            </div>

            {/* Bottom Perks */}
            <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/15 text-[11px] sm:text-xs text-cream/80">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#D6A23F] shrink-0" />
                <span>100% Handloom Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake size={16} className="text-[#D6A23F] shrink-0" />
                <span>Direct Artisan Support</span>
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-[#FAF7F2]">
            <div className="mb-6 sm:mb-8">
              {title && (
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs sm:text-sm text-charcoal/60 mt-1.5">{subtitle}</p>}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
