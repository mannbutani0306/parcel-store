import React from 'react';
import { motion } from 'motion/react';

export type StickerColor =
  | 'mint'
  | 'blush'
  | 'stamp-blue'
  | 'saffron'
  | 'kraft'
  | 'paper-2'
  | 'tomato';

export type StickerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface StickerProps {
  emoji: string;
  color?: StickerColor;
  size?: StickerSize;
  rotation?: number;
  shape?: 'organic' | 'circle' | 'stamp' | 'square';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  label?: string;
}

const colorMap: Record<StickerColor, { bg: string; text: string }> = {
  mint: { bg: 'bg-[#BCD9C4]', text: 'text-[#14231C]' },
  blush: { bg: 'bg-[#F2C4B8]', text: 'text-[#14231C]' },
  'stamp-blue': { bg: 'bg-[#A9CBE0]', text: 'text-[#14231C]' },
  saffron: { bg: 'bg-[#F4B63F]', text: 'text-[#14231C]' },
  kraft: { bg: 'bg-[#C99A67]', text: 'text-[#14231C]' },
  'paper-2': { bg: 'bg-[#EADFCB]', text: 'text-[#14231C]' },
  tomato: { bg: 'bg-[#E8502B]', text: 'text-[#F3EBDD]' },
};

const sizeMap: Record<StickerSize, { container: string; emojiSize: string; shadow: string }> = {
  sm: { container: 'w-11 h-11 text-lg', emojiSize: 'text-xl', shadow: 'shadow-[2px_2px_0_#14231C]' },
  md: { container: 'w-16 h-16 text-2xl', emojiSize: 'text-3xl', shadow: 'shadow-[3px_3px_0_#14231C]' },
  lg: { container: 'w-24 h-24 text-4xl', emojiSize: 'text-5xl', shadow: 'shadow-[4px_4px_0_#14231C]' },
  xl: { container: 'w-32 h-32 text-6xl', emojiSize: 'text-7xl', shadow: 'shadow-[5px_5px_0_#14231C]' },
};

const shapeRadii = {
  organic: 'rounded-[44%_56%_62%_38%/42%_45%_55%_58%]',
  circle: 'rounded-full',
  stamp: 'rounded-[14px]',
  square: 'rounded-[18px]',
};

export const Sticker: React.FC<StickerProps> = ({
  emoji,
  color = 'mint',
  size = 'md',
  rotation = -2,
  shape = 'organic',
  className = '',
  interactive = false,
  onClick,
  label,
}) => {
  const colorConfig = colorMap[color] || colorMap.mint;
  const sizeConfig = sizeMap[size] || sizeMap.md;
  const radius = shapeRadii[shape] || shapeRadii.organic;

  const content = (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      <div
        className={`
          flex items-center justify-center
          border-[2px] border-[#14231C]
          ${colorConfig.bg}
          ${sizeConfig.container}
          ${sizeConfig.shadow}
          ${radius}
          transition-transform duration-200
        `}
      >
        <span
          className={`${sizeConfig.emojiSize} filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] leading-none`}
        >
          {emoji}
        </span>
      </div>

      {label && (
        <span className="font-label-mono mt-1.5 px-2 py-0.5 bg-[#14231C] text-[#F3EBDD] rounded-[4px] text-[10px] tracking-widest uppercase">
          {label}
        </span>
      )}
    </div>
  );

  if (interactive) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ rotate: rotation }}
        whileHover={{
          y: -4,
          rotate: rotation - 2,
          scale: 1.05,
          transition: { type: 'spring', stiffness: 380, damping: 30 },
        }}
        whileTap={{
          scale: 0.96,
          y: -1,
          transition: { type: 'spring', stiffness: 400, damping: 25 },
        }}
        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C] rounded-lg"
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div style={{ transform: `rotate(${rotation}deg)` }} className="inline-block">
      {content}
    </div>
  );
};
