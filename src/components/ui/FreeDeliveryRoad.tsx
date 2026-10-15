import React from 'react';
import { motion } from 'motion/react';
import { formatINR } from '../../lib/format';

export interface FreeDeliveryRoadProps {
  subtotal: number;
  threshold?: number;
  className?: string;
}

export const FreeDeliveryRoad: React.FC<FreeDeliveryRoadProps> = ({
  subtotal,
  threshold = 999,
  className = '',
}) => {
  const progress = Math.min(100, Math.max(0, (subtotal / threshold) * 100));
  const remaining = Math.max(0, threshold - subtotal);
  const isUnlocked = remaining === 0;

  return (
    <div
      className={`bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-3.5 shadow-[2px_2px_0_#14231C] select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">{isUnlocked ? '🎉' : '📦'}</span>
          <p className="font-label-mono text-xs font-bold text-[#14231C] truncate">
            {isUnlocked ? (
              <span className="text-[#286345]">COMPLIMENTARY POSTAL DISPATCH UNLOCKED!</span>
            ) : (
              <span>
                Add <strong className="text-[#E8502B]">{formatINR(remaining)}</strong> for FREE Delivery
              </span>
            )}
          </p>
        </div>
        <span className="font-mono text-[10px] font-bold text-[#14231C]/70 shrink-0">
          {progress.toFixed(0)}%
        </span>
      </div>

      {/* The Postal Delivery Road */}
      <div className="relative h-6 bg-[#D8CEBA] border-[1.5px] border-[#14231C] rounded-full overflow-hidden shadow-inner flex items-center px-2">
        {/* Road centerline dashes */}
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-[2px] flex justify-between gap-1.5 opacity-30 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex-1 h-full bg-[#14231C]" />
          ))}
        </div>

        {/* Filled Green/Tomato Asphalt Track */}
        <motion.div
          className={`absolute left-0 top-0 bottom-0 ${
            isUnlocked ? 'bg-[#286345]/30' : 'bg-[#E8502B]/20'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Moving Postal Delivery Truck 🚚 */}
        <motion.div
          className="absolute z-10 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
          initial={{ left: '0%' }}
          animate={{
            left: `calc(${progress}% - ${progress > 85 ? '26px' : '14px'})`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="text-base select-none leading-none">🚚</span>
        </motion.div>

        {/* Destination Post Box Flag 📮 */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs opacity-80 pointer-events-none">
          📮
        </div>
      </div>
    </div>
  );
};
