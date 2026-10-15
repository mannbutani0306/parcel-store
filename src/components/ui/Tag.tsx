import React from 'react';
import { formatINR } from '../../lib/format';

export type TagVariant =
  | 'kraft'
  | 'paper'
  | 'paper-2'
  | 'saffron'
  | 'mint'
  | 'blush'
  | 'stamp-blue'
  | 'tomato';

export interface TagProps {
  price?: number;
  label?: string;
  sublabel?: string;
  variant?: TagVariant;
  size?: 'sm' | 'md' | 'lg';
  withString?: boolean;
  className?: string;
  rotation?: number;
}

const variantStyles: Record<TagVariant, string> = {
  kraft: 'bg-[#C99A67] text-[#14231C]',
  paper: 'bg-[#EADFCB] text-[#14231C]',
  'paper-2': 'bg-[#EADFCB] text-[#14231C]',
  saffron: 'bg-[#F4B63F] text-[#14231C]',
  mint: 'bg-[#BCD9C4] text-[#14231C]',
  blush: 'bg-[#F2C4B8] text-[#14231C]',
  'stamp-blue': 'bg-[#A9CBE0] text-[#14231C]',
  tomato: 'bg-[#E8502B] text-[#F3EBDD]',
};

export const Tag: React.FC<TagProps> = ({
  price,
  label,
  sublabel,
  variant = 'kraft',
  size = 'md',
  withString = true,
  className = '',
  rotation = 0,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
      className={`inline-flex items-center select-none ${className}`}
    >
      {/* Postal Twine String */}
      {withString && (
        <div className="relative -mr-1 z-10 shrink-0 pointer-events-none">
          <svg
            width={isSm ? '20' : isLg ? '32' : '26'}
            height={isSm ? '14' : isLg ? '20' : '16'}
            viewBox="0 0 32 20"
            fill="none"
            stroke="#14231C"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            {/* Organic looped twine */}
            <path d="M2 10C8 3 14 1 20 6C24 9 28 8 30 10" />
            <path d="M2 10C7 16 13 18 19 14C23 11 27 12 30 10" strokeDasharray="2 1.5" />
          </svg>
        </div>
      )}

      {/* The Shipping Tag Body */}
      <div
        className={`
          relative flex items-center
          border-[1.5px] border-[#14231C]
          rounded-[6px]
          ${variantStyles[variant]}
          ${isSm ? 'py-1 px-2.5 gap-2' : isLg ? 'py-2.5 px-5 gap-3.5' : 'py-1.5 px-3.5 gap-2.5'}
          shadow-[2px_2px_0_#14231C]
        `}
      >
        {/* Punched Eyelet Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <div
            className={`
              rounded-full border-[1.5px] border-[#14231C] bg-[#F3EBDD]
              ${isSm ? 'w-2.5 h-2.5' : isLg ? 'w-4 h-4' : 'w-3 h-3'}
            `}
          >
            <div className="w-full h-full rounded-full bg-[#14231C]/15" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col leading-none">
          {label && (
            <span
              className={`
                font-label-mono text-[#14231C]/70
                ${isSm ? 'text-[9px]' : isLg ? 'text-[12px]' : 'text-[10px]'}
              `}
            >
              {label}
            </span>
          )}

          {price !== undefined && (
            <span
              className={`
                font-mono font-medium tracking-tight text-[#14231C]
                ${isSm ? 'text-xs' : isLg ? 'text-lg' : 'text-sm'}
              `}
            >
              {formatINR(price)}
            </span>
          )}

          {sublabel && (
            <span className="font-label-mono text-[9px] text-[#14231C]/60 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
