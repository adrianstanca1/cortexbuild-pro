import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number; className?: string; label?: string }> = ({ size = 24, className = '', label }) => {
  const dimension = `${size}px`;
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        className="animate-spin text-slate-400"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          opacity="0.25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;

