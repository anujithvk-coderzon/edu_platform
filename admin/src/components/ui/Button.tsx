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
  const baseClasses = 'inline-flex items-center justify-center rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-offset-1 sm:focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] sm:hover:scale-105 active:scale-95 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl';

  const variants = {
    default: 'bg-[#1D4ED8] text-white hover:from-[#1E40AF] hover:via-[#1E40AF] hover:to-[#912018] focus:ring-[#1D4ED8]/50 shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl backdrop-blur-sm',
    secondary: 'bg-[#F6F8FA] text-[#1E293B] hover:from-[#DDE3EA] hover:via-[#C7D2DE] hover:to-[#94A3B8] focus:ring-[#64748B]/50 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl backdrop-blur-sm',
    outline: 'border-2 border-[#C7D7FE] bg-white/80 backdrop-blur-sm text-[#1E40AF] hover:bg-[#EFF4FF] hover:border-[#A4BCFC] focus:ring-[#1D4ED8]/50 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl',
    ghost: 'text-[#334155] hover:bg-white/50 hover:text-[#1E40AF] focus:ring-[#64748B]/30 backdrop-blur-sm',
    destructive: 'bg-[#B42318] text-white hover:from-[#B42318] hover:via-[#912018] hover:to-[#912018] focus:ring-[#F04438]/50 shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl backdrop-blur-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm',
    md: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base',
    lg: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg',
    xl: 'px-8 py-4 text-lg sm:px-10 sm:py-5 sm:text-xl',
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