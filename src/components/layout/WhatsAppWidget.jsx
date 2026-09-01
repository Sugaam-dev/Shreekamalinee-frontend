import { FaWhatsapp } from "react-icons/fa6";
import { useBankDetailsQuery } from "../../queries/useSettingsQueries.js";

export default function WhatsAppWidget() {
  const { data: settings } = useBankDetailsQuery();
  const rawPhone = settings?.whatsappNumber || settings?.contactPhone || "919820785210";
  const cleanPhone = rawPhone.replace(/\D/g, "");

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 z-[100]">
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14">
        {/* Animated Ripple Waves */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 animate-wave-1 pointer-events-none" />
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 animate-wave-2 pointer-events-none" />
        <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 animate-wave-3 pointer-events-none" />

        {/* Floating Button */}
        <a
          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hello Shreekamalinee, I'm visiting your online store and have an inquiry about your latest handloom collections!")}`}
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
