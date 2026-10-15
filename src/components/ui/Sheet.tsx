import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  side = 'right',
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const slideAnimation = {
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  }[side];

  const positionClasses = {
    right: 'top-0 right-0 h-full w-full max-w-md rounded-l-[22px] border-l-[1.5px]',
    left: 'top-0 left-0 h-full w-full max-w-md rounded-r-[22px] border-r-[1.5px]',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[22px] border-t-[1.5px]',
  }[side];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#14231C]/50 backdrop-blur-[2px]"
          />

          {/* Drawer Paper Sheet */}
          <motion.div
            initial={slideAnimation.initial}
            animate={slideAnimation.animate}
            exit={slideAnimation.exit}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`
              fixed ${positionClasses}
              bg-[#F3EBDD] border-[#14231C]
              shadow-[-6px_0_0_#14231C] flex flex-col z-10
              ${className}
            `}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-[#EADFCB] px-6 py-4 border-b-[1.5px] border-[#14231C] flex items-center justify-between shrink-0">
              <div>
                {title && (
                  <h3 className="font-fraunces text-lg font-semibold text-[#14231C] tracking-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="font-label-mono text-[10px] text-[#14231C]/65 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-[6px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
