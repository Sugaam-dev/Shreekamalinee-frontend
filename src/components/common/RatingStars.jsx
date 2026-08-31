import { Star } from "lucide-react";

export default function RatingStars({
  rating = 5,
  maxStars = 5,
  size = 14,
  interactive = false,
  onRatingChange,
  className = "",
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(maxStars)].map((_, i) => {
        const starNumber = i + 1;
        const isFilled = starNumber <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange && onRatingChange(starNumber)}
            className={`${
              interactive ? "cursor-pointer hover:scale-115 transition-transform" : "cursor-default"
            } p-0.5`}
          >
            <Star
              size={size}
              className={`${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "text-stone-300 stroke-[1.5]"
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
