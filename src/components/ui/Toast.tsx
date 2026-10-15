import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToastStore, StampToast } from '../../store/toastStore';
import { HandTick } from './Icons';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: StampToast;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const isTomato = toast.variant === 'tomato';
  const isAirmail = toast.variant === 'airmail';
  const isMint = toast.variant === 'mint';
  const isWax = toast.variant === 'wax';

  const bgStyles = isTomato
    ? 'bg-[#E8502B] text-[#F3EBDD]'
    : isMint
      ? 'bg-[#BCD9C4] text-[#14231C]'
      : isWax
        ? 'bg-[#F4B63F] text-[#14231C]'
        : 'bg-[#EADFCB] text-[#14231C]';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.9, rotate: -3 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -12, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`
        pointer-events-auto relative flex items-start gap-3 p-3.5
        border-[1.5px] border-[#14231C] rounded-[8px]
        ${bgStyles}
        shadow-[4px_4px_0_#14231C]
      `}
    >
      {/* Airmail top stripe if airmail variant */}
      {isAirmail && (
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[6px] overflow-hidden flex">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#E8502B]' : 'bg-[#2D668A]'}`}
            />
          ))}
        </div>
      )}

      {/* Rubber stamp mark */}
      <div
        className={`
          shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-[1.5px]
          ${isTomato ? 'border-[#F3EBDD] bg-[#F3EBDD]/15' : 'border-[#14231C] bg-[#14231C]/10'}
        `}
      >
        <HandTick size={16} className={isTomato ? 'text-[#F3EBDD]' : 'text-[#14231C]'} />
      </div>

      {/* Text message */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <p
            className={`font-label-mono font-bold tracking-wider text-xs ${
              isTomato ? 'text-[#F3EBDD]' : 'text-[#14231C]'
            }`}
          >
            {toast.title}
          </p>
          {toast.badge && (
            <span className="text-[9px] font-label-mono px-1.5 py-0.2 rounded border border-current opacity-80">
              {toast.badge}
            </span>
          )}
        </div>
        {toast.message && (
          <p
            className={`text-xs mt-0.5 line-clamp-2 ${
              isTomato ? 'text-[#F3EBDD]/85' : 'text-[#14231C]/75'
            }`}
          >
            {toast.message}
          </p>
        )}
        {toast.action && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className={`
                px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider
                border border-current transition-transform active:scale-95 cursor-pointer
                ${isTomato ? 'hover:bg-white/20 text-[#F3EBDD]' : 'hover:bg-[#14231C]/15 text-[#14231C]'}
              `}
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className={`
          shrink-0 p-1 rounded hover:opacity-75 cursor-pointer
          text-xs font-mono leading-none
          ${isTomato ? 'text-[#F3EBDD]' : 'text-[#14231C]'}
        `}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </motion.div>
  );
};
