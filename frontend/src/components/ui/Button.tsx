import React from 'react';

type ButtonVariant = 'primary' | 'deal' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizes: Record<ButtonSize, React.CSSProperties> = {
  xs: { padding: '0.3rem 0.65rem', fontSize: '0.75rem',    gap: '0.3rem',  borderRadius: '6px' },
  sm: { padding: '0.45rem 0.875rem', fontSize: '0.8125rem', gap: '0.375rem', borderRadius: '7px' },
  md: { padding: '0.6rem 1.125rem', fontSize: '0.875rem',  gap: '0.45rem',  borderRadius: '8px' },
  lg: { padding: '0.75rem 1.5rem',  fontSize: '0.9375rem', gap: '0.5rem',   borderRadius: '9px' },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: '#0d9488', color: '#fff', border: '1.5px solid #0d9488', boxShadow: '0 1px 3px rgba(13,148,136,0.25)' },
  deal:      { background: '#f97316', color: '#fff', border: '1.5px solid #f97316', boxShadow: '0 1px 3px rgba(249,115,22,0.25)' },
  secondary: { background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb' },
  outline:   { background: '#fff',    color: '#374151', border: '1.5px solid #d1d5db' },
  ghost:     { background: 'transparent', color: '#6b7280', border: '1.5px solid transparent' },
  danger:    { background: '#dc2626', color: '#fff', border: '1.5px solid #dc2626' },
};

const hoverVariants: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: '#0f766e', borderColor: '#0f766e', boxShadow: '0 4px 10px rgba(13,148,136,0.28)' },
  deal:      { background: '#ea580c', borderColor: '#ea580c', boxShadow: '0 4px 10px rgba(249,115,22,0.28)' },
  secondary: { background: '#e5e7eb', borderColor: '#d1d5db' },
  outline:   { background: '#f9fafb', borderColor: '#9ca3af' },
  ghost:     { background: '#f3f4f6', color: '#374151' },
  danger:    { background: '#b91c1c', borderColor: '#b91c1c' },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  onMouseEnter,
  onMouseLeave,
  style,
  className = '',
  ...props
}) => {
  const [hovered, setHovered] = React.useState(false);

  const isDisabled = disabled || isLoading;

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.58 : 1,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...sizes[size],
    ...variants[variant],
    ...(hovered && !isDisabled ? hoverVariants[variant] : {}),
    ...style,
  };

  return (
    <button
      className={`btn-press ${className}`}
      disabled={isDisabled}
      style={base}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...props}
    >
      {isLoading && (
        <span style={{
          width: 14, height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
