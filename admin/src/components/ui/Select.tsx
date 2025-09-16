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
          "flex h-12 w-full items-center justify-between rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50",
          isOpen && "ring-4 ring-indigo-500/20 border-indigo-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={cn(selectedOption ? "text-slate-900 font-medium" : "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 text-slate-400 transition-all duration-200",
            isOpen && "rotate-180 text-indigo-600"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border-2 border-slate-200 bg-white py-2 shadow-xl backdrop-blur-sm">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex w-full items-center px-4 py-3 text-sm font-medium transition-all duration-150 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none",
                value === option.value && "bg-indigo-100 text-indigo-700"
              )}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className="flex-1 text-left">{option.label}</span>
              {value === option.value && (
                <CheckIcon className="h-4 w-4 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}