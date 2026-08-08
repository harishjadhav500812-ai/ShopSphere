import React from 'react';

interface SkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ height = '1.25rem', width = '100%', borderRadius = '6px' }) => {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonLoading 1.5s infinite',
      }}
    />
  );
};
