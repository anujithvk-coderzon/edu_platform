import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const describedBy = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-ui font-medium text-[#0F172A]"
          >
            {label}
            {required && <span className="ml-0.5 text-[#B42318]">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8] [&>svg]:h-5 [&>svg]:w-5">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'block w-full rounded-[4px] border bg-white px-3.5 py-2.5 text-body text-[#0F172A]',
              'transition-colors placeholder:text-[#94A3B8]',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:bg-[#F6F8FA] disabled:text-[#64748B]',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error
                ? 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/15'
                : 'border-[#DDE3EA] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/15',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#94A3B8] [&>svg]:h-5 [&>svg]:w-5">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-caption text-[#B42318]">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-caption text-[#64748B]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
