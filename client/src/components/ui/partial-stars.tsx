"use client";

import { Star } from "lucide-react";

type PartialStarsProps = {
  /** Rating from 0 to 5 (can be decimal, e.g. 4.3) */
  rating: number;
  size?: number;
  className?: string;
};

/**
 * Renders 5 stars with partial fill based on decimal rating (e.g. 4.3 = 4 full + 1 at 30%).
 */
export function PartialStars({ rating, size = 20, className = "" }: PartialStarsProps) {
  const value = Math.min(5, Math.max(0, Number(rating)));

  return (
    <span className={`inline-flex shrink-0 ${className}`} aria-label={`Rating: ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fillAmount = Math.min(1, Math.max(0, value - (i - 1)));
        return (
          <span
            key={i}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            <Star
              size={size}
              className="absolute inset-0 text-current"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            />
            {fillAmount > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <Star
                  size={size}
                  className="text-current"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
