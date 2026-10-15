import React from 'react';

export interface ReceiptProps {
  children: React.ReactNode;
  orderNumber?: string;
  date?: string;
  className?: string;
  variant?: 'paper' | 'paper-2' | 'kraft';
  shadow?: boolean;
}

export const Receipt: React.FC<ReceiptProps> = ({
  children,
  orderNumber,
  date,
  className = '',
  variant = 'paper',
  shadow = true,
}) => {
  const bgClass =
    variant === 'paper-2' ? 'bg-[#EADFCB]' : variant === 'kraft' ? 'bg-[#C99A67]' : 'bg-[#F3EBDD]';

  return (
    <div
      className={`
        relative mx-auto w-full max-w-md
        ${shadow ? 'shadow-[4px_4px_0_#14231C]' : ''}
        ${className}
      `}
    >
      {/* Top Perforated Sawtooth Edge */}
      <div className="w-full h-3 overflow-hidden shrink-0 -mb-[1px]">
        <svg
          viewBox="0 0 360 12"
          preserveAspectRatio="none"
          className="w-full h-full block"
          fill="none"
        >
          <path
            d="M0 12 L10 0 L20 12 L30 0 L40 12 L50 0 L60 12 L70 0 L80 12 L90 0 L100 12 L110 0 L120 12 L130 0 L140 12 L150 0 L160 12 L170 0 L180 12 L190 0 L200 12 L210 0 L220 12 L230 0 L240 12 L250 0 L260 12 L270 0 L280 12 L290 0 L300 12 L310 0 L320 12 L330 0 L340 12 L350 0 L360 12 Z"
            fill={variant === 'paper-2' ? '#EADFCB' : variant === 'kraft' ? '#C99A67' : '#F3EBDD'}
            stroke="#14231C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Main Receipt Sheet Body */}
      <div
        className={`
          relative border-x-[1.5px] border-[#14231C]
          ${bgClass}
          px-6 py-5
        `}
      >
        {/* Subtle decorative postal watermark / header line */}
        {(orderNumber || date) && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b-[1.5px] border-dashed border-[#14231C]/35">
            {orderNumber && (
              <span className="font-label-mono text-xs font-semibold text-[#14231C]">
                {orderNumber}
              </span>
            )}
            {date && (
              <span className="font-label-mono text-[10px] text-[#14231C]/65">
                {date}
              </span>
            )}
          </div>
        )}

        {children}
      </div>

      {/* Bottom Perforated Sawtooth Edge */}
      <div className="w-full h-3 overflow-hidden shrink-0 -mt-[1px]">
        <svg
          viewBox="0 0 360 12"
          preserveAspectRatio="none"
          className="w-full h-full block"
          fill="none"
        >
          <path
            d="M0 0 L10 12 L20 0 L30 12 L40 0 L50 12 L60 0 L70 12 L80 0 L90 12 L100 0 L110 12 L120 0 L130 12 L140 0 L150 12 L160 0 L170 12 L180 0 L190 12 L200 0 L210 12 L220 0 L230 12 L240 0 L250 12 L260 0 L270 12 L280 0 L290 12 L300 0 L310 12 L320 0 L330 12 L340 0 L350 12 L360 0 Z"
            fill={variant === 'paper-2' ? '#EADFCB' : variant === 'kraft' ? '#C99A67' : '#F3EBDD'}
            stroke="#14231C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
