import React from 'react';
import { ParcelBoxIcon } from './Icons';

export interface BrandWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withBoxBeside?: boolean;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  className = '',
  size = 'md',
  withBoxBeside = true,
}) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  }[size];

  const boxSizes = {
    sm: 18,
    md: 22,
    lg: 28,
    xl: 34,
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 select-none tracking-tight group ${className}`}
    >
      <span
        className={`
          font-fraunces font-semibold text-[#14231C] lowercase leading-none
          ${sizeClasses}
          transition-transform duration-200 group-hover:-translate-y-0.5
        `}
      >
        parcel
      </span>

      {withBoxBeside && (
        <span
          className="inline-block transform -rotate-12 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
          style={{ transformOrigin: 'center center' }}
        >
          <ParcelBoxIcon size={boxSizes} className="drop-shadow-[1px_1px_0_#14231C]" />
        </span>
      )}
    </div>
  );
};
