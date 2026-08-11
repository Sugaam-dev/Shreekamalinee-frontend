import { motion } from "motion/react";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-cream/30 px-4">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-charcoal/10 rounded-full w-full h-full" />
        {/* Spin ring */}
        <motion.div
          className="absolute inset-0 border-t-2 border-r-2 border-rust rounded-full w-full h-full"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear"
          }}
        />
        {/* Inner brand symbol marker */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-rust" />
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 font-serif text-[11px] tracking-[0.25em] uppercase text-charcoal/70"
      >
        Shreekamalinee
      </motion.p>
    </div>
  );
}
