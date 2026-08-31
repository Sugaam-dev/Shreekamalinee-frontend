import { CheckCircle } from "lucide-react";
import RatingStars from "../common/RatingStars.jsx";

export default function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-line rounded-sm p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <RatingStars rating={review.rating} size={14} />
          <span className="text-[11px] text-charcoal/40">{review.date}</span>
        </div>

        {review.title && (
          <h4 className="font-serif font-bold text-sm text-charcoal mb-2 leading-snug">
            "{review.title}"
          </h4>
        )}

        <p className="text-xs text-charcoal/70 leading-relaxed">{review.comment}</p>
      </div>

      <div className="pt-4 mt-4 border-t border-line/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-charcoal">{review.author}</span>
          {review.verified && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium"
              title="Verified Buyer"
            >
              <CheckCircle size={11} className="fill-emerald-600 text-white" />
              Verified
            </span>
          )}
        </div>
        {review.userLocation && (
          <span className="text-[11px] text-charcoal/45">{review.userLocation}</span>
        )}
      </div>
    </div>
  );
}
