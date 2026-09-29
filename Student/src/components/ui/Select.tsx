import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  label,
  error,
  options,
  placeholder = 'Select an option...',
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;

  return (
    <div className="space-y-1 sm:space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs sm:text-sm font-semibold text-[#0F172A] mb-1 sm:mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          id={selectId}
          className={cn(
            'block w-full rounded-[4px] sm:rounded-[6px] border-2 border-[#DDE3EA] bg-white px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-sm sm:text-base text-[#0F172A]  transition-all duration-200 hover:border-[#C7D2DE] focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-white appearance-none pr-8 sm:pr-10',
            error && 'border-[#B42318] focus:ring-[#B42318]/20 focus:border-[#B42318] bg-[#FEF3F2]/50',
            className
          )}
          ref={ref}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#64748B] group-focus-within:text-[#1D4ED8] transition-colors duration-200" fill="none" viewBox="0 0 20 20">
            <path
              d="M6 8L10 12L14 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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

Select.displayName = 'Select';

export { Select };