import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'tag' | 'sheet' | 'pill' | 'default';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'default',
}) => {
  const roundedClass = {
    tag: 'rounded-[6px]',
    sheet: 'rounded-[22px]',
    pill: 'rounded-full',
    default: 'rounded-[8px]',
  }[rounded];

  return (
    <div
      className={`skeleton-paper border-[1px] border-[#14231C]/10 ${roundedClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
};
