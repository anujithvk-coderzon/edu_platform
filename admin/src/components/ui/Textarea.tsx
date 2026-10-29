import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  /** Show a live "n / max" counter under the field. Requires `maxLength`. */
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCount = true, maxLength, value, defaultValue, ...props }, ref) => {
    // Controlled and uncontrolled callers both pass through here, so fall back
    // to defaultValue before giving up on a count.
    const current = String(value ?? defaultValue ?? '').length;
    const withCount = showCount && typeof maxLength === 'number';
    const nearLimit = withCount && current > maxLength * 0.9;
    const atLimit = withCount && current >= maxLength;

    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] sm:min-h-[100px] md:min-h-[120px] w-full rounded-lg sm:rounded-xl border-2 border-[#DDE3EA] bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#F6F8FA] disabled:text-[#64748B]",
            error && "border-[#F97066] focus:ring-[#F04438]/20 focus:border-[#F04438] bg-[#FEF3F2]/50",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />

        {/* Error and counter share a row so the field height stays stable. */}
        {(error || withCount) && (
          <div className="mt-1 flex items-start justify-between gap-3">
            {error ? (
              <p className="text-xs sm:text-sm text-[#B42318] font-medium flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            ) : (
              <span />
            )}

            {withCount && (
              <span
                className={cn(
                  "text-xs tabular-nums flex-shrink-0",
                  atLimit ? "text-[#B42318] font-semibold"
                    : nearLimit ? "text-[#B45309]"
                    : "text-[#64748B]"
                )}
              >
                {current.toLocaleString('en-IN')} / {maxLength.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
