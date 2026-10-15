import React from 'react';

/**
 * Tactile paper grain noise overlay using SVG feTurbulence.
 * Fixed over the entire viewport with ~6% opacity and pointer-events none.
 */
export const Grain: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 select-none overflow-hidden"
      style={{ opacity: 0.055, mixBlendMode: 'multiply' }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="parcel-noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#parcel-noise-filter)" />
      </svg>
    </div>
  );
};
