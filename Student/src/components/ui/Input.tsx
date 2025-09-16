import React from 'react';
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
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <div className="text-slate-500 group-focus-within:text-blue-600 w-5 h-5 transition-colors duration-200">{leftIcon}</div>
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50',
            leftIcon && 'pl-12',
            rightIcon && 'pr-12',
            error && 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
            <div className="text-slate-500 group-focus-within:text-blue-600 w-5 h-5 transition-colors duration-200">{rightIcon}</div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center mt-1">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
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