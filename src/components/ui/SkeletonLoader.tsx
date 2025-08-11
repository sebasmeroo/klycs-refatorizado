import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-300 dark:bg-gray-600';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'text':
        return 'rounded h-4';
      case 'card':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} mb-2 last:mb-0`}
            style={getStyle()}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={getStyle()}
    />
  );
};

// Predefined skeleton components
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border rounded-lg ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <SkeletonLoader variant="circular" width={50} height={50} />
      <div className="flex-1">
        <SkeletonLoader width="60%" className="mb-2" />
        <SkeletonLoader width="40%" />
      </div>
    </div>
    <SkeletonLoader lines={3} className="mb-4" />
    <div className="flex space-x-2">
      <SkeletonLoader variant="rectangular" width={80} height={32} />
      <SkeletonLoader variant="rectangular" width={80} height={32} />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className = '' 
}) => (
  <div className={className}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 py-3 border-b last:border-b-0">
        <SkeletonLoader variant="circular" width={40} height={40} />
        <div className="flex-1">
          <SkeletonLoader width="70%" className="mb-1" />
          <SkeletonLoader width="50%" />
        </div>
        <SkeletonLoader variant="rectangular" width={60} height={24} />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <SkeletonLoader key={index} variant="rectangular" height={20} className="flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader key={colIndex} height={16} className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default SkeletonLoader;