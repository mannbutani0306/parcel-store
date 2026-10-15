import React from 'react';
import { motion } from 'motion/react';

export interface MatchRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export const MatchRing: React.FC<MatchRingProps> = ({
  percentage,
  size = 44,
  strokeWidth = 3.5,
  className = '',
  label = 'MATCH',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={`${clamped}% ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#14231C"
          strokeOpacity="0.16"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8502B"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none select-none">
        <span className="font-mono text-[9px] font-bold text-[#14231C]">{clamped}%</span>
        {label && (
          <span className="text-[6px] font-label-mono text-[#14231C]/70 font-semibold tracking-tighter">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
