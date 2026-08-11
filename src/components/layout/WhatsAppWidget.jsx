import { FaWhatsapp } from "react-icons/fa6";

export default function WhatsAppWidget() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 z-[100]">
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14">
        {/* Animated Ripple Waves */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 animate-wave-1 pointer-events-none" />
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 animate-wave-2 pointer-events-none" />
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 animate-wave-3 pointer-events-none" />

        {/* Floating Button */}
        <a
          href="https://wa.me/9820785210?text=Hello%20Shreekamalinee,%20I'm%20visiting%20your%20online%20boutique%20and%20have%20an%20inquiry%20about%20your%20latest%20handloom%20collections!"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-gradient-to-tr from-[#20ba5a] to-[#25D366] hover:from-[#1da750] hover:to-[#22c35e] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-rotate-6 cursor-pointer z-10 border border-white/20"
          title="Inquire on WhatsApp"
        >
          <FaWhatsapp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 drop-shadow-xs" />
        </a>
      </div>
    </div>
  );
}
