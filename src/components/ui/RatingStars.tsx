import React, { useState } from 'react';
import { HandStar } from './Icons';

export interface RatingStarsProps {
  rating: number; // e.g. 4.8 or 5
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
  showValue = false,
  reviewCount,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div className="flex items-center gap-0.5 text-[#F4B63F]">
        {Array.from({ length: max }).map((_, idx) => {
          const starVal = idx + 1;
          const isFilled = displayRating >= starVal;
          const isHalf = !isFilled && displayRating >= starVal - 0.5;

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starVal)}
              onMouseEnter={() => interactive && setHoverRating(starVal)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`
                relative p-0.5 transition-transform
                ${interactive ? 'cursor-pointer hover:scale-115 active:scale-95' : 'cursor-default'}
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#14231C]
              `}
              aria-label={`Rate ${starVal} out of ${max} stars`}
            >
              {isHalf ? (
                <div className="relative">
                  <HandStar size={size} filled={false} className="text-[#14231C]/30" />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <HandStar size={size} filled={true} className="text-[#F4B63F]" />
                  </div>
                </div>
              ) : (
                <HandStar
                  size={size}
                  filled={isFilled}
                  className={isFilled ? 'text-[#F4B63F]' : 'text-[#14231C]/25'}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-mono text-xs font-semibold text-[#14231C] tracking-tight">
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className="font-label-mono text-[10px] text-[#14231C]/60">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
