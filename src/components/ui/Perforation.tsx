import React from 'react';

export interface PerforationProps {
  notchBg?: string; // background color to match outer container, defaults to #F3EBDD
  notchSize?: number; // diameter of notch in px
  className?: string;
  label?: string;
  showScissors?: boolean;
}

export const Perforation: React.FC<PerforationProps> = ({
  notchBg = '#F3EBDD',
  notchSize = 18,
  className = '',
  label,
  showScissors = false,
}) => {
  const halfNotch = notchSize / 2;

  return (
    <div
      className={`relative flex items-center my-4 overflow-hidden w-full select-none ${className}`}
      style={{ height: `${notchSize}px` }}
    >
      {/* Left semicircle cutout notch */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full z-10 border-r-[1.5px] border-y-[1.5px] border-[#14231C]"
        style={{
          width: `${halfNotch}px`,
          height: `${notchSize}px`,
          backgroundColor: notchBg,
          marginLeft: '-1px',
        }}
      />

      {/* Dashed tear line */}
      <div className="w-full flex items-center px-4">
        <div className="flex-1 border-b-[1.5px] border-dashed border-[#14231C]/45" />

        {(label || showScissors) && (
          <div className="mx-3 flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#EADFCB] text-[#14231C]/75 border-[1px] border-[#14231C]/30 text-[10px] font-label-mono">
            {showScissors && <span className="text-xs -scale-x-100">✂️</span>}
            {label && <span>{label}</span>}
          </div>
        )}

        <div className="flex-1 border-b-[1.5px] border-dashed border-[#14231C]/45" />
      </div>

      {/* Right semicircle cutout notch */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full z-10 border-l-[1.5px] border-y-[1.5px] border-[#14231C]"
        style={{
          width: `${halfNotch}px`,
          height: `${notchSize}px`,
          backgroundColor: notchBg,
          marginRight: '-1px',
        }}
      />
    </div>
  );
};
