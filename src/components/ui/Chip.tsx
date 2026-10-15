import React from 'react';
import { motion } from 'motion/react';

export interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  emoji?: string;
  count?: number;
  className?: string;
  variant?: 'default' | 'kraft' | 'tomato';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onClick,
  emoji,
  count,
  className = '',
  variant = 'default',
}) => {
  const getColors = () => {
    if (active) {
      if (variant === 'tomato') {
        return 'bg-[#E8502B] text-[#F3EBDD] border-[#14231C] shadow-[2px_2px_0_#14231C]';
      }
      return 'bg-[#14231C] text-[#F3EBDD] border-[#14231C] shadow-[2px_2px_0_#E8502B]';
    }
    return 'bg-transparent text-[#14231C] hover:bg-[#14231C]/6 border-[#14231C]/40 hover:border-[#14231C]';
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      whileTap={{ y: 1, scale: 0.98 }}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5
        rounded-full border-[1.5px]
        text-xs font-medium tracking-wide
        select-none cursor-pointer whitespace-nowrap shrink-0
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C]
        ${getColors()}
        ${className}
      `}
    >
      {emoji && <span className="text-sm leading-none">{emoji}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`
            ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-label-mono
            ${active ? 'bg-[#F3EBDD] text-[#14231C]' : 'bg-[#14231C]/10 text-[#14231C]'}
          `}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};
