import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

export default function Hero() {
  const slides = [
    {
      categoryTag: "Heritage Saree Collection",
      image: "https://t4.ftcdn.net/jpg/01/67/25/37/360_F_167253732_FVaF7PyA5vat3JVPvP4F5AsCoZkYAnZF.jpg",
      title: "Timeless Handloom Sarees",
      subtitle: "Exquisite Paithani, Maheshwari & Kota Doriya weaves crafted for royal elegance.",
      cta: "Explore Sarees",
      link: "/product?category=Sarees"
    },
    {
      categoryTag: "Unstitched Elegance",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM5sbrA3H_wvBXbKNMLeNMMjXiSMkZCk2J0cePvIn7WD2mtTCLykACV6A&s=10",
      title: "Pure Handcrafted Dress Materials",
      subtitle: "Tailor your custom fit with authentic Ikat, Jamdani & Kota Doriya cotton suits.",
      cta: "Shop Dress Material",
      link: "/product?category=Dress%20Material"
    },
    {
      categoryTag: "Contemporary Wear",
      image: "https://thumbs.dreamstime.com/b/fashion-clothes-21701906.jpg",
      title: "Ready-To-Wear Designer Ensembles",
      subtitle: "Effortless style and comfort with tailored tops, kurtis with dupatta, and one-piece drapes.",
      cta: "Shop Readymades",
      link: "/product?category=Readymade"
    },
    {
      categoryTag: "Ethnic Accents",
      image: "https://t4.ftcdn.net/jpg/01/10/24/33/360_F_110243334_UHbWD6dt3evUcgr5Jf3aOWxMBuU3Q08k.jpg",
      title: "Handcrafted Heritage Accessories",
      subtitle: "Complete your look with luxury sling bags, Paithani clutches, and embroidered pouches.",
      cta: "Shop Accessories",
      link: "/product?category=Accessories"
    }
  ];

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward (slide left), -1 = backward (slide right)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  const selectSlide = (index) => {
    if (index === current) return;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  // Manual drag/swipe support
  const pointerStart = useRef(null);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e) => {
    pointerStart.current = e.clientX;
    isDragging.current = true;
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (!isDragging.current || pointerStart.current === null) return;
    isDragging.current = false;
    const diff = e.clientX - pointerStart.current;
    const swipeThreshold = 50;
    if (diff < -swipeThreshold) {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (diff > swipeThreshold) {
      setDirection(-1);
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }
    pointerStart.current = null;
  }, [slides.length]);

  const handlePointerCancel = useCallback(() => {
    isDragging.current = false;
    pointerStart.current = null;
  }, []);

  // Variants for horizontal sliding animations
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <section
      className="relative h-[calc(100vh-110px)] w-full overflow-hidden bg-charcoal"
      style={{ userSelect: "none", touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 180, damping: 24 },
            opacity: { duration: 0.4 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Main image with very slow breathing zoom effect */}
          <motion.img
            src={slides[current].image}
            alt={slides[current].title}
            initial={{ scale: 1.0 }}
            animate={{ scale: 1.03 }}
            transition={{ duration: 5500, ease: "easeOut" }}
            className="w-full h-full object-cover object-[center_30%]"
          />
          {/* Reduced lighter overlay so background imagery is bright & clear */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10" />
          
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 z-20">
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[10.5px] md:text-[12px] tracking-[0.3em] uppercase text-mustard font-semibold mb-4 px-4 py-1.5 bg-black/40 rounded-full border border-mustard/40 backdrop-blur-sm shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              {slides[current].categoryTag}
            </motion.span>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-serif font-bold text-3xl sm:text-5xl md:text-6xl text-white leading-[1.18] mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] max-w-3xl"
            >
              {slides[current].title}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-sm md:text-[17px] text-white/95 max-w-xl mb-8 font-normal tracking-wide leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
            >
              {slides[current].subtitle}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link
                to={slides[current].link}
                className="px-9 py-4 bg-rust text-white hover:bg-mustard hover:text-charcoal text-[12px] md:text-[13px] tracking-[0.2em] uppercase font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(189,91,52,0.4)] hover:shadow-[0_6px_25px_rgba(214,162,63,0.5)] cursor-pointer inline-block rounded-xs border border-white/20 hover:scale-[1.03] active:scale-[0.98]"
              >
                {slides[current].cta}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-30">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => selectSlide(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              i === current ? "bg-rust scale-110" : "bg-white/50 hover:bg-white"
            }`}
            title={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
