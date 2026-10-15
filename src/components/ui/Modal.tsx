import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  // Lock body scroll when open
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with warm ink tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#14231C]/60 backdrop-blur-[2px]"
          />

          {/* Modal Paper Sheet: 22px sheet radius */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`
              relative w-full ${maxWidthMap[maxWidth]}
              bg-[#F3EBDD] border-[1.5px] border-[#14231C]
              rounded-[22px] shadow-[6px_6px_0_#14231C]
              overflow-hidden z-10
            `}
            role="dialog"
            aria-modal="true"
          >
            {/* Postal header strip */}
            <div className="bg-[#EADFCB] px-6 py-4 border-b-[1.5px] border-[#14231C] flex items-center justify-between">
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

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-[6px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 text-[#14231C]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
