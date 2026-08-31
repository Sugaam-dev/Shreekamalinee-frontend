import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 py-6 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center border border-line rounded-xs text-charcoal/70 hover:border-rust hover:text-rust disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white shadow-xs"
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 text-xs font-semibold rounded-xs border transition-all cursor-pointer ${
              isActive
                ? "bg-rust text-white border-rust shadow-xs"
                : "bg-white text-charcoal/80 border-line hover:border-rust hover:text-rust"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center border border-line rounded-xs text-charcoal/70 hover:border-rust hover:text-rust disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white shadow-xs"
        aria-label="Next Page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
