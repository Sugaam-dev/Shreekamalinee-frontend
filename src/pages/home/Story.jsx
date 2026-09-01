import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function Story() {


  return (
    <section id="story" className="pt-2 md:pt-4 pb-14 md:pb-20 bg-cream">
      <div className="max-w-[1280px] min-[2000px]:max-w-[2100px] mx-auto px-6 md:px-10 grid md:grid-cols-2 items-center gap-12 md:gap-20">
        
        {/* Left Column: Story photo with sliding entry, no decorative border */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full group"
        >
          <div className="aspect-[4/5] overflow-hidden bg-cream-2 rounded-sm shadow-md relative">
            <img
              src="https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80"
              alt="Handcrafted Weaving Story"
              className="w-full h-full object-cover transition-transform duration-[8000ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent" />
          </div>
        </motion.div>

        {/* Right Column: Copywriting & Stats */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="space-y-6"
        >
          <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-rust font-semibold">
            Why Shreekamalinee
          </span>
          <h2 className="font-serif font-medium text-[28px] md:text-[42px] leading-tight text-charcoal">
            Every piece begins with a fabric story, not a fast trend.
          </h2>
          <p className="text-[15px] leading-relaxed text-charcoal/60">
            We work with small-batch weavers across the country, choosing slubs,
            mulmuls and modal drapes that breathe in the heat and soften with
            every wash. No two dye lots are quite the same — and that's the point of true heritage luxury.
          </p>

          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[12px] tracking-[0.12em] uppercase font-semibold border border-charcoal bg-charcoal text-cream hover:bg-rust hover:border-rust transition-colors cursor-pointer rounded-xs shadow-xs"
            >
              <span>Explore The Collection</span>
              <ArrowRight size={14} className="stroke-[2.2]" />
            </Link>
          </div>


        </motion.div>

      </div>
    </section>
  );
}
