import { Link } from "react-router-dom";
import { Home, ShoppingBag, ArrowLeft } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function NotFoundPage() {
  useSEO({
    title: "Page Not Found — Shreekamalinee",
    description: "The requested handloom page could not be located.",
  });

  return (
    <div className="bg-cream min-h-screen py-20 flex items-center justify-center text-center">
      <div className="max-w-md mx-auto px-6 space-y-6">
        <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-rust block">
          Error 404
        </span>
        <h1 className="font-serif text-6xl font-bold text-charcoal">404</h1>
        <div className="w-12 h-0.5 bg-rust mx-auto" />

        <h2 className="font-serif text-2xl font-bold text-charcoal">
          This Royal Weave Could Not Be Found
        </h2>
        <p className="text-xs sm:text-sm text-charcoal/60 leading-relaxed">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full" icon={Home}>
              Back to Home
            </Button>
          </Link>
          <Link to="/shop" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full" icon={ShoppingBag}>
              Explore Shop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
