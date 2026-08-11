import { motion } from "motion/react";
import useSEO from "../../hooks/useSEO.js";


export default function AboutPage() {
  useSEO({
    title: "About Our Heritage",
    description: "Learn about the heritage and legacy of Shreekamalinee. We design premium handcrafted Indian sarees, unstitched suit materials, and heritage accessories."
  });


  return (
    <div className="bg-cream min-h-screen py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10">
        
        {/* Header Title with Framer Motion */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16 md:mb-24"
        >
          <span className="text-[11px] tracking-[0.25em] uppercase text-rust font-semibold block mb-3">
            Our Story & Legacy
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-tight text-charcoal">
            Artisanship over Fast Trends
          </h1>
          <div className="w-16 h-0.5 bg-rust mx-auto mt-6" />
        </motion.div>

        {/* Section 1: Split Screen Layout */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-20 md:mb-32">
          {/* Animated Image Wrapper */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="aspect-[4/5] bg-cream-2 overflow-hidden rounded-sm shadow-md group relative"
          >
            <img
              src="https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80"
              alt="Handloom Weaving Craft"
              className="w-full h-full object-cover transition-transform duration-[8000ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/15 to-transparent" />
          </motion.div>

          {/* Animated Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="space-y-6"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-charcoal leading-snug">
              Every thread carries the whisper of an artisan weaver.
            </h2>
            <p className="text-[15px] leading-relaxed text-charcoal/70">
              Shreekamalinee was founded with a single mission: to create contemporary ethnic designs 
              for women while preserving traditional Indian weaving techniques. We partner directly 
              with small-batch weavers across the country, selecting pure slub silks, raw cottons, 
              and organic linens.
            </p>
            <p className="text-[15px] leading-relaxed text-charcoal/70">
              No two dye lots are ever exactly alike, and that variation is what makes your garment 
              truly unique. Crafted slowly, finished by hand, and designed to breathe in the summer 
              heat. We create garments meant to be treasured across seasons, not discarded after weeks.
            </p>
          </motion.div>
        </div>



        {/* Section 4: Founders Signature / Philosophy Quote */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center max-w-xl mx-auto mt-24 md:mt-32 pt-8 border-t border-line/40"
        >
          <p className="font-serif italic text-lg md:text-xl text-charcoal/80 leading-relaxed mb-4">
            "We believe that real luxury lies in the details — the touch of raw handspun silk, 
            the slight asymmetry of hand-carved woodblock prints, and the warmth of keeping 
            artisanship alive."
          </p>
          <span className="block text-[11px] uppercase tracking-widest text-rust font-bold">
            — The Shreekamalinee Family
          </span>
        </motion.div>

      </div>
    </div>
  );
}
