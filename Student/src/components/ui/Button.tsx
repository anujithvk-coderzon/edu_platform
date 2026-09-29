import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-[4px] font-semibold transition-colors ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'disabled:cursor-not-allowed';

  // Fill is reserved for the primary action; everything else stays quiet so a
  // screen only ever has one obvious next step.
  const variants = {
    default:
      'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:bg-[#E9EEF4] disabled:text-[#94A3B8] focus-visible:outline-[#1D4ED8]',
    secondary:
      'bg-[#F6F8FA] text-[#0F172A] hover:bg-[#E9EEF4] disabled:text-[#94A3B8] focus-visible:outline-[#0F172A]',
    outline:
      'border border-[#DDE3EA] bg-white text-[#0F172A] hover:border-[#1D4ED8] hover:text-[#1D4ED8] disabled:text-[#94A3B8] focus-visible:outline-[#1D4ED8]',
    ghost:
      'text-[#475569] hover:bg-[#F6F8FA] hover:text-[#0F172A] disabled:text-[#94A3B8] focus-visible:outline-[#0F172A]',
    destructive:
      'bg-[#B42318] text-white hover:bg-[#912018] disabled:bg-[#E9EEF4] disabled:text-[#94A3B8] focus-visible:outline-[#B42318]',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-caption',
    md: 'px-5 py-2.5 text-ui',
    lg: 'px-6 py-3 text-body',
    xl: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      ref={ref}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {rightIcon && !loading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };