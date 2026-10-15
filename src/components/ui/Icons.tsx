import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Hand-drawn postal arrow with organic calligraphic taper
 */
export const HandArrow: React.FC<IconProps> = ({ className = '', size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${className}`}
    {...props}
  >
    <path d="M4 12.3c4.2-.3 11-.4 15.2.2" />
    <path d="M14.5 6.8c1.8 1.9 3.9 4.2 5.2 5.5-1.5 1.4-3.6 3.8-5.4 5.9" />
  </svg>
);

/**
 * Hand-drawn checkmark / tick with postal ink character
 */
export const HandTick: React.FC<IconProps> = ({ className = '', size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${className}`}
    {...props}
  >
    <path d="M4.5 12.8c2.1 1.9 4.4 4.3 6.2 6.4C14.8 13.5 18.2 8.4 21 4.5" />
  </svg>
);

/**
 * Hand-drawn 5-pointed star
 */
export const HandStar: React.FC<IconProps & { filled?: boolean }> = ({
  className = '',
  size = 18,
  filled = false,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${className}`}
    {...props}
  >
    <path d="M12 2.8l2.6 5.8 6.3.7-4.7 4.3 1.3 6.3-5.5-3.2-5.5 3.2 1.3-6.3L3.1 9.3l6.3-.7L12 2.8z" />
  </svg>
);

/**
 * Hand-drawn postal heart
 */
export const HandHeart: React.FC<IconProps & { filled?: boolean }> = ({
  className = '',
  size = 20,
  filled = false,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${className}`}
    {...props}
  >
    <path d="M12 20.2s-7.5-4.8-9.3-8.8c-1.3-2.9-.3-6.4 2.8-7.3 2.6-.8 5.1.7 6.5 2.7 1.4-2 3.9-3.5 6.5-2.7 3.1.9 4.1 4.4 2.8 7.3-1.8 4-9.3 8.8-9.3 8.8z" />
  </svg>
);

/**
 * Hand-drawn scribble underline for accent words in headlines
 */
export const ScribbleUnderline: React.FC<IconProps> = ({ className = '', ...props }) => (
  <svg
    viewBox="0 0 160 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full block overflow-visible ${className}`}
    preserveAspectRatio="none"
    {...props}
  >
    <path
      d="M2 11c24-4.5 58-5.8 82-2.8 28 3.5 48 3.2 74-2.2M8 14c32-2.5 64-1.8 98-4.5 18-1.4 34-1.2 50 .5"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Postal airmail / cancellation wavy lines
 */
export const PostalWavyLines: React.FC<IconProps> = ({ className = '', ...props }) => (
  <svg
    width="54"
    height="20"
    viewBox="0 0 54 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    className={className}
    {...props}
  >
    <path d="M1 5c4.5-3 9-3 13.5 0s9 3 13.5 0 9-3 13.5 0 8 3 11.5 0" />
    <path d="M1 10c4.5-3 9-3 13.5 0s9 3 13.5 0 9-3 13.5 0 8 3 11.5 0" />
    <path d="M1 15c4.5-3 9-3 13.5 0s9 3 13.5 0 9-3 13.5 0 8 3 11.5 0" />
  </svg>
);

/**
 * Hand-crafted 3D tilted parcel box for brand mark and icons
 */
export const ParcelBoxIcon: React.FC<IconProps> = ({ className = '', size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${className}`}
    {...props}
  >
    <path d="M12 2.5L3.5 7.2v9.6L12 21.5l8.5-4.7V7.2L12 2.5z" fill="#C99A67" fillOpacity="0.45" />
    <path d="M12 2.5L3.5 7.2l8.5 4.8 8.5-4.8L12 2.5z" />
    <path d="M12 12v9.5" />
    <path d="M7.8 4.8l8.4 4.8" strokeDasharray="1.5 1.5" />
    <path d="M3.5 7.2L12 12l8.5-4.8" />
  </svg>
);
