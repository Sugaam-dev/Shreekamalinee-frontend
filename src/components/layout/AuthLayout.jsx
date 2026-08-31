import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export default function AuthLayout({ children, title, subtitle, image }) {
  return (
    <div className="bg-cream min-h-screen py-10 md:py-16 flex items-center justify-center">
      <div className="max-w-[1100px] w-full mx-auto px-4 md:px-8">
        <div className="bg-white border border-line rounded-sm shadow-xl overflow-hidden grid lg:grid-cols-2">
          {/* Left / Top Editorial Heritage Side */}
          <div className="relative bg-charcoal text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={
                  image ||
                  "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=1200&q=80"
                }
                alt="Shreekamalinee Heritage"
                className="w-full h-full object-cover opacity-35 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/50" />
            </div>

            {/* Top Brand Info */}
            <div className="relative z-10 space-y-4">
              <Link to="/" className="inline-block">
                <img
                  src="/shreekamalineeLogo.png"
                  alt="Shreekamalinee"
                  className="h-16 w-auto object-contain brightness-150 drop-shadow-md"
                />
              </Link>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#D6A23F] text-[10px] uppercase font-bold tracking-widest backdrop-blur-sm">
                <Sparkles size={12} />
                <span>The Royal Handloom Legacy</span>
              </div>
            </div>

            {/* Middle Quote */}
            <div className="relative z-10 my-10 md:my-14 space-y-3">
              <blockquote className="font-serif text-2xl md:text-3xl font-light italic leading-snug text-cream">
                "Where centuries of traditional weaving meet royal contemporary grace."
              </blockquote>
              <p className="text-xs text-cream/70 tracking-wider uppercase">
                Direct from master artisans across Maharashtra
              </p>
            </div>

            {/* Bottom Perks */}
            <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/15 text-xs text-cream/80">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#D6A23F] shrink-0" />
                <span>100% Handloom Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake size={16} className="text-[#D6A23F] shrink-0" />
                <span>Fair Trade Artisan Support</span>
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-[#FAF7F2]">
            <div className="mb-8">
              {title && (
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs md:text-sm text-charcoal/60 mt-1.5">{subtitle}</p>}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
