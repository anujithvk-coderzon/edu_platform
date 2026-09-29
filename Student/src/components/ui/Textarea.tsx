import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className,
  label,
  error,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId}`;

  return (
    <div className="space-y-1 sm:space-y-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 sm:mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'block w-full rounded-[4px] sm:rounded-[6px] border-2 border-[#DDE3EA] bg-white px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8]  transition-all duration-200 hover:border-[#C7D2DE] focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-white min-h-[80px] sm:min-h-[100px] resize-y',
          error && 'border-[#B42318] focus:ring-[#B42318]/20 focus:border-[#B42318] bg-[#FEF3F2]/50',
          className
        )}
        ref={ref}
        {...props}
      />
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

Textarea.displayName = 'Textarea';

export { Textarea };