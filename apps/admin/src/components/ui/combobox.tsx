import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  className = '',
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.length === 0) return placeholder;
      if (currentValues.length === 1) return options.find(o => o.value === currentValues[0])?.label || currentValues[0];
      return `${currentValues.length} selected`;
    } else {
      const selectedOption = options.find(o => o.value === value);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-right flex items-center justify-between px-3 py-2.5 rounded-lg border bg-[rgba(255,255,255,0.02)] text-[var(--text)] transition-colors ${
          isOpen ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
      >
        <span className={`block truncate ${!value || (Array.isArray(value) && value.length === 0) ? 'text-[var(--sub)]' : ''}`}>
          {getDisplayValue()}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--sub)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ width: '16px', height: '16px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--panel)] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-[rgba(255,255,255,0.06)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--sub)] outline-none"
              placeholder="بحث..."
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[var(--sub)] text-center">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = multiple
                  ? (Array.isArray(value) && value.includes(option.value))
                  : value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-right flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      isSelected ? 'bg-[var(--primary)] text-white' : 'text-[var(--text)] hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    {multiple && (
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'border-white bg-white/20' : 'border-[var(--sub)]'
                      }`} style={{ width: '16px', height: '16px' }}>
                        {isSelected && <svg className="w-3 h-3 text-white" style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    )}
                    <span className="truncate">{option.label}</span>
                    {!multiple && isSelected && (
                      <svg className="w-4 h-4 mr-auto" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
