import React from 'react';

export interface StampProps {
  text: string;
  subtext?: string;
  shape?: 'rect' | 'round' | 'oval';
  variant?: 'tomato' | 'stamp-blue' | 'ink' | 'mint' | 'saffron';
  rotation?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorStyles = {
  tomato: 'text-[#E8502B] border-[#E8502B]',
  'stamp-blue': 'text-[#2D668A] border-[#2D668A]',
  ink: 'text-[#14231C] border-[#14231C]',
  mint: 'text-[#286345] border-[#286345]',
  saffron: 'text-[#B07308] border-[#B07308]',
};

export const Stamp: React.FC<StampProps> = ({
  text,
  subtext,
  shape = 'rect',
  variant = 'tomato',
  rotation = -4,
  size = 'md',
  className = '',
}) => {
  const colorClass = colorStyles[variant] || colorStyles.tomato;

  if (shape === 'round') {
    const sizeDimensions =
      size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-24 h-24' : 'w-18 h-18';

    return (
      <div
        style={{ transform: `rotate(${rotation}deg)` }}
        className={`inline-flex items-center justify-center select-none ${className}`}
      >
        <div
          className={`
            relative rounded-full border-2 border-dashed
            flex flex-col items-center justify-center p-1.5
            ${sizeDimensions}
            ${colorClass}
            transition-transform duration-200
          `}
        >
          {/* Inner ring */}
          <div
            className={`
              w-full h-full rounded-full border-[1.5px] border-solid
              flex flex-col items-center justify-center text-center p-1
            `}
          >
            <span
              className={`
                font-label-mono font-bold tracking-widest uppercase leading-none
                ${size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[12px]' : 'text-[10px]'}
              `}
            >
              {text}
            </span>
            {subtext && (
              <span
                className={`
                  font-label-mono text-[7px] tracking-normal opacity-80 mt-0.5
                `}
              >
                {subtext}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Rectangular rubber stamp badge
  const sizePadding =
    size === 'sm'
      ? 'px-2 py-0.5 text-[9px]'
      : size === 'lg'
        ? 'px-4 py-1.5 text-xs'
        : 'px-2.5 py-1 text-[11px]';

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`inline-block select-none ${className}`}
    >
      <div
        className={`
          relative border-2 border-solid rounded-[3px]
          font-label-mono font-bold tracking-[0.14em] uppercase text-center
          ${sizePadding}
          ${colorClass}
          bg-transparent
        `}
        style={{
          boxShadow: 'inset 0 0 0 1px currentColor',
        }}
      >
        <span className="block leading-none">{text}</span>
        {subtext && (
          <span className="block text-[8px] tracking-widest font-normal opacity-80 mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
