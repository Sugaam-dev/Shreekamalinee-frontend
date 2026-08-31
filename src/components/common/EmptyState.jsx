import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import Button from "./Button.jsx";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No items found",
  description = "We couldn't find what you were looking for.",
  actionLabel,
  actionTo,
  onActionClick,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-line rounded-sm bg-white/50 my-6 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-cream-2 flex items-center justify-center text-rust mb-4 shadow-xs">
        <Icon size={28} className="stroke-[1.5]" />
      </div>

      <h3 className="font-serif text-xl font-bold text-charcoal mb-2">{title}</h3>
      <p className="text-xs md:text-sm text-charcoal/60 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        actionTo ? (
          <Link to={actionTo}>
            <Button variant="primary" size="md">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button variant="primary" size="md" onClick={onActionClick}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
