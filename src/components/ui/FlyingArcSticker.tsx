import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface FlyingItem {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
}

export interface FlyingArcStickerProps {
  items: FlyingItem[];
  onComplete: (id: number) => void;
}

export const FlyingArcSticker: React.FC<FlyingArcStickerProps> = ({ items, onComplete }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {items.map((item) => {
          // Target position near top right bag icon
          const targetX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 75) : 300;
          const targetY = 32;

          // Compute midpoint with upward arc
          const midX = (item.startX + targetX) / 2;
          const midY = Math.min(item.startY, targetY) - 90;

          return (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX,
                y: item.startY,
                scale: 1.1,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: [item.startX, midX, targetX],
                y: [item.startY, midY, targetY],
                scale: [1.1, 1.25, 0.35],
                rotate: [0, -25, 45],
                opacity: [1, 1, 0.1],
              }}
              transition={{
                duration: 0.68,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.5, 1],
              }}
              onAnimationComplete={() => onComplete(item.id)}
              className="absolute top-0 left-0 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] select-none pointer-events-none"
            >
              {item.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
