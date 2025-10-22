'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { cn } from '../../utils/cn';

export interface AutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  suggestions: string[];
  onSearch: (query: string) => string[];
  onChange?: (value: string) => void;
  maxSuggestions?: number;
}

const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(({
  className,
  label,
  error,
  leftIcon,
  suggestions: _suggestions,
  onSearch,
  onChange,
  value,
  maxSuggestions = 10,
  id,
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState((value as string) || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id || `autocomplete-${generatedId}`;

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue((value as string) || '');
  }, [value]);

  // Handle search and filter suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (query.trim() === '') {
      setFilteredSuggestions([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else {
      const results = onSearch(query).slice(0, maxSuggestions);
      setFilteredSuggestions(results);
      setShowDropdown(results.length > 0);
      setSelectedIndex(-1);
    }

    onChange?.(query);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onChange?.(suggestion);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleFocus = () => {
    setIsFocused(true);
    if (inputValue.trim() && filteredSuggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (!isFocused) {
        setShowDropdown(false);
      }
    }, 200);
  };

  return (
    <div className="space-y-2 relative">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 md:pl-4 flex items-center pointer-events-none z-10">
            <div className="text-slate-500 group-focus-within:text-indigo-600 w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200">
              {leftIcon}
            </div>
          </div>
        )}
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete="off"
          className={cn(
            'block w-full rounded-lg sm:rounded-xl border-2 border-slate-200 bg-white px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50',
            leftIcon && 'pl-9 sm:pl-10 md:pl-12',
            error && 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/50',
            className
          )}
          {...props}
        />

        {/* Dropdown suggestions */}
        {showDropdown && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg sm:rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                className={cn(
                  'w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base transition-colors duration-150',
                  'hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none',
                  selectedIndex === index ? 'bg-indigo-100 text-indigo-900' : 'text-slate-700',
                  index === 0 && 'rounded-t-lg sm:rounded-t-xl',
                  index === filteredSuggestions.length - 1 && 'rounded-b-lg sm:rounded-b-xl'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center mt-1">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Autocomplete.displayName = 'Autocomplete';

export { Autocomplete };
