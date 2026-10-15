import React, { useState } from 'react';
import { motion } from 'motion/react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      prefixIcon,
      suffixIcon,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      id,
      className = '',
      type = 'text',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || `parcel-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const [isFocused, setIsFocused] = useState(false);
    const [hasVal, setHasVal] = useState(Boolean(value || defaultValue));

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasVal(Boolean(e.target.value));
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasVal(Boolean(e.target.value));
      onChange?.(e);
    };

    const isFloated = isFocused || hasVal || Boolean(value);

    return (
      <div className={`relative w-full pt-4 ${className}`}>
        <div className="relative flex items-center">
          {prefixIcon && (
            <span className="shrink-0 mr-2 text-[#14231C]/60 select-none">{prefixIcon}</span>
          )}

          <div className="relative w-full">
            {/* Floating label */}
            <label
              htmlFor={inputId}
              className={`
                absolute left-0 pointer-events-none transition-all duration-200 ease-out select-none
                ${
                  isFloated
                    ? '-top-3.5 text-[10px] font-label-mono tracking-widest uppercase ' +
                      (error
                        ? 'text-[#E8502B]'
                        : isFocused
                          ? 'text-[#14231C] font-semibold'
                          : 'text-[#14231C]/60')
                    : 'top-2 text-sm text-[#14231C]/50 font-normal'
                }
              `}
            >
              {label}
            </label>

            {/* Input field */}
            <input
              ref={ref}
              id={inputId}
              type={type}
              value={value}
              defaultValue={defaultValue}
              disabled={disabled}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`
                w-full bg-transparent py-2 px-0 text-sm font-medium text-[#14231C]
                placeholder-transparent border-0 outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              {...props}
            />
          </div>

          {suffixIcon && (
            <span className="shrink-0 ml-2 text-[#14231C]/60 select-none">{suffixIcon}</span>
          )}
        </div>

        {/* Base underline */}
        <div className="w-full h-[1.5px] bg-[#14231C]/25 relative overflow-hidden">
          {/* Animated active underline */}
          <motion.div
            initial={false}
            animate={{
              scaleX: isFocused ? 1 : 0,
              backgroundColor: error ? '#E8502B' : '#14231C',
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 origin-left h-full"
          />
        </div>

        {/* Error or Hint message */}
        {error ? (
          <p className="mt-1 text-[11px] font-label-mono text-[#E8502B] flex items-center gap-1">
            <span>●</span> {error}
          </p>
        ) : hint ? (
          <p className="mt-1 text-[10px] font-label-mono text-[#14231C]/50">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
