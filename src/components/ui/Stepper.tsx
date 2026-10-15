import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { validateAddToCartQty } from '../../lib/validators';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  allowDirectInput?: boolean;
  showMicroMessage?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 10,
  size = 'md',
  disabled = false,
  className = '',
  allowDirectInput = true,
  showMicroMessage = true,
}) => {
  const [inputValue, setInputValue] = useState(String(value));
  const [microMessage, setMicroMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const triggerShake = (msg = '1 to 10 per order') => {
    setIsShaking(true);
    setMicroMessage(msg);
    setTimeout(() => setIsShaking(false), 500);
    setTimeout(() => setMicroMessage(null), 3000);
  };

  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
      setMicroMessage(null);
    } else if (value <= min) {
      triggerShake('Minimum 1 unit');
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
      setMicroMessage(null);
    } else if (value >= max) {
      triggerShake('Maximum 10 per order');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseInt(raw, 10);

    if (isNaN(parsed)) {
      return;
    }

    const valResult = validateAddToCartQty(parsed);
    if (!valResult.valid) {
      triggerShake('1 to 10 per order');
      if (parsed <= 0) {
        onChange(min);
      } else if (parsed > max) {
        onChange(max);
      }
    } else {
      setMicroMessage(null);
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < min) {
      triggerShake('1 to 10 per order');
      onChange(min);
      setInputValue(String(min));
    } else if (parsed > max) {
      triggerShake('1 to 10 per order');
      onChange(max);
      setInputValue(String(max));
    } else {
      onChange(parsed);
      setInputValue(String(parsed));
    }
  };

  const isSm = size === 'sm';

  return (
    <div className="relative inline-flex flex-col items-start">
      <motion.div
        animate={isShaking ? { x: [0, -6, 6, -5, 5, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className={`
          inline-flex items-center
          border-[1.5px] border-[#14231C]
          rounded-[6px] bg-[#EADFCB]
          shadow-[2px_2px_0_#14231C]
          overflow-hidden
          ${isShaking ? 'ring-2 ring-[#E8502B]' : ''}
          ${className}
        `}
      >
        {/* Decrement Button */}
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min || disabled}
          whileTap={{ scale: 0.9, backgroundColor: '#14231C', color: '#F3EBDD' }}
          className={`
            flex items-center justify-center
            text-[#14231C] hover:bg-[#14231C]/10
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors duration-100 cursor-pointer
            border-r-[1.5px] border-[#14231C] select-none
            ${isSm ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm font-semibold'}
          `}
          aria-label="Decrease quantity"
        >
          −
        </motion.button>

        {/* Numeric value readout / input */}
        {allowDirectInput ? (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={`
              font-mono font-bold tabular-nums text-center text-[#14231C] bg-transparent outline-none
              ${isSm ? 'w-7 text-xs' : 'w-10 text-sm'}
            `}
            aria-label="Order quantity"
          />
        ) : (
          <div
            className={`
              font-mono font-medium tabular-nums text-center text-[#14231C] select-none
              ${isSm ? 'w-7 text-xs' : 'w-10 text-sm'}
            `}
          >
            {value}
          </div>
        )}

        {/* Increment Button */}
        <motion.button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max || disabled}
          whileTap={{ scale: 0.9, backgroundColor: '#14231C', color: '#F3EBDD' }}
          className={`
            flex items-center justify-center
            text-[#14231C] hover:bg-[#14231C]/10
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors duration-100 cursor-pointer
            border-l-[1.5px] border-[#14231C] select-none
            ${isSm ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm font-semibold'}
          `}
          aria-label="Increase quantity"
        >
          +
        </motion.button>
      </motion.div>

      {/* Micro message notification */}
      <AnimatePresence>
        {showMicroMessage && microMessage && (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-5 left-0 whitespace-nowrap font-label-mono text-[9px] font-bold text-[#E8502B] uppercase tracking-wider bg-[#F3EBDD] px-1 py-0.5 rounded border border-[#E8502B]/40 shadow-xs z-10"
          >
            {microMessage}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

