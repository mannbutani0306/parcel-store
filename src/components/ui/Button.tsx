import React from 'react';
import { motion } from 'motion/react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tomato' | 'kraft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon,
      iconRight,
      fullWidth = false,
      disabled = false,
      className = '',
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'py-1.5 px-3 text-xs gap-1.5 rounded-[6px]',
      md: 'py-2.5 px-5 text-sm gap-2 rounded-[8px]',
      lg: 'py-3.5 px-7 text-base gap-2.5 rounded-[10px]',
    };

    // Primary: ink bg, paper text, hard tomato shadow that presses in
    if (variant === 'primary') {
      return (
        <motion.button
          ref={ref}
          type={type}
          disabled={disabled}
          onClick={onClick}
          whileHover={
            !disabled
              ? {
                  y: -2,
                  x: -1,
                  rotate: -0.5,
                  boxShadow: '5px 5px 0 #E8502B',
                  transition: { type: 'spring', stiffness: 380, damping: 30 },
                }
              : undefined
          }
          whileTap={
            !disabled
              ? {
                  y: 2,
                  x: 2,
                  rotate: 0,
                  boxShadow: '1px 1px 0 #E8502B',
                  transition: { type: 'spring', stiffness: 450, damping: 25 },
                }
              : undefined
          }
          className={`
            inline-flex items-center justify-center font-medium select-none cursor-pointer
            border-[1.5px] border-[#14231C]
            bg-[#14231C] text-[#F3EBDD]
            shadow-[4px_4px_0_#E8502B]
            tracking-wide
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8502B] focus-visible:ring-offset-2
            ${sizeClasses[size]}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...(props as any)}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="whitespace-nowrap shrink-0">{children}</span>
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </motion.button>
      );
    }

    // Secondary: outlined with ink border
    if (variant === 'secondary') {
      return (
        <motion.button
          ref={ref}
          type={type}
          disabled={disabled}
          onClick={onClick}
          whileHover={
            !disabled
              ? {
                  y: -1.5,
                  rotate: -0.5,
                  boxShadow: '3px 3px 0 #14231C',
                  transition: { type: 'spring', stiffness: 380, damping: 30 },
                }
              : undefined
          }
          whileTap={
            !disabled
              ? {
                  y: 1,
                  boxShadow: '1px 1px 0 #14231C',
                  transition: { type: 'spring', stiffness: 450, damping: 25 },
                }
              : undefined
          }
          className={`
            inline-flex items-center justify-center font-medium select-none cursor-pointer
            border-[1.5px] border-[#14231C]
            bg-transparent text-[#14231C] hover:bg-[#14231C]/6
            shadow-[2px_2px_0_#14231C]
            tracking-wide
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C] focus-visible:ring-offset-2
            ${sizeClasses[size]}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...(props as any)}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="whitespace-nowrap shrink-0">{children}</span>
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </motion.button>
      );
    }

    // Tomato variant (high intent accent)
    if (variant === 'tomato') {
      return (
        <motion.button
          ref={ref}
          type={type}
          disabled={disabled}
          onClick={onClick}
          whileHover={
            !disabled
              ? {
                  y: -2,
                  boxShadow: '5px 5px 0 #14231C',
                  transition: { type: 'spring', stiffness: 380, damping: 30 },
                }
              : undefined
          }
          whileTap={
            !disabled
              ? {
                  y: 2,
                  x: 2,
                  boxShadow: '1px 1px 0 #14231C',
                  transition: { type: 'spring', stiffness: 450, damping: 25 },
                }
              : undefined
          }
          className={`
            inline-flex items-center justify-center font-medium select-none cursor-pointer
            border-[1.5px] border-[#14231C]
            bg-[#E8502B] text-[#F3EBDD]
            shadow-[4px_4px_0_#14231C]
            tracking-wide
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C] focus-visible:ring-offset-2
            ${sizeClasses[size]}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...(props as any)}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="whitespace-nowrap shrink-0">{children}</span>
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </motion.button>
      );
    }

    // Ghost: quiet, no border
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`
          inline-flex items-center justify-center font-medium select-none cursor-pointer
          border-[1.5px] border-transparent
          bg-transparent text-[#14231C] hover:bg-[#14231C]/8 active:bg-[#14231C]/12
          transition-colors duration-150
          tracking-wide
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C]
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="whitespace-nowrap shrink-0">{children}</span>
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
