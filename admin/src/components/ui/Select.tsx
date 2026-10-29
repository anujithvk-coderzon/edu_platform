'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex h-10 sm:h-11 md:h-12 w-full items-center justify-between rounded-lg sm:rounded-xl border-2 border-[#DDE3EA] bg-white px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 text-sm sm:text-base text-[#0F172A] shadow-sm transition-all duration-200 hover:border-[#C7D2DE] focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#F6F8FA]",
          isOpen && "ring-2 sm:ring-4 ring-[#1D4ED8]/20 border-[#1D4ED8]"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={cn("text-sm sm:text-base", selectedOption ? "text-[#0F172A] font-medium" : "text-[#94A3B8]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 sm:h-5 sm:w-5 text-[#94A3B8] transition-all duration-200",
            isOpen && "rotate-180 text-[#1D4ED8]"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 sm:mt-2 max-h-48 sm:max-h-60 w-full overflow-auto rounded-lg sm:rounded-xl border-2 border-[#DDE3EA] bg-white py-1 sm:py-2 shadow-lg sm:shadow-xl backdrop-blur-sm">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex w-full items-center px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-150 hover:bg-[#EFF4FF] focus:bg-[#EFF4FF] focus:outline-none",
                value === option.value && "bg-[#DBE7FE] text-[#1E40AF]"
              )}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className="flex-1 text-left">{option.label}</span>
              {value === option.value && (
                <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#1D4ED8]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}