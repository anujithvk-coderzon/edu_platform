import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  type,
  label,
  error,
  leftIcon,
  rightIcon,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <div className="space-y-1 sm:space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-semibold text-[#334155] mb-1 sm:mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 md:pl-4 flex items-center pointer-events-none z-10">
            <div className="text-[#64748B] group-focus-within:text-[#1D4ED8] w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200">{leftIcon}</div>
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'block w-full rounded-lg sm:rounded-xl border-2 border-[#DDE3EA] bg-white px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] shadow-sm transition-all duration-200 hover:border-[#C7D2DE] focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#F6F8FA]',
            leftIcon && 'pl-8 sm:pl-10 md:pl-12',
            rightIcon && 'pr-8 sm:pr-10 md:pr-12',
            error && 'border-[#F97066] focus:ring-[#F04438]/20 focus:border-[#F04438] bg-[#FEF3F2]/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 md:pr-4 flex items-center pointer-events-none z-10">
            <div className="text-[#64748B] group-focus-within:text-[#1D4ED8] w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200">{rightIcon}</div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs sm:text-sm text-[#B42318] font-medium flex items-center mt-1">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };