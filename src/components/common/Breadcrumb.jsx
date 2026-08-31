import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-charcoal/50 py-3 mb-4 overflow-x-auto no-scrollbar">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-rust transition-colors shrink-0"
      >
        <Home size={13} />
        <span>Home</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight size={12} className="text-charcoal/30" />
            {isLast || !item.to ? (
              <span className="font-semibold text-charcoal truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-rust transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
