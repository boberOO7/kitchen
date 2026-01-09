"use client";

import { useState, useCallback } from "react";

interface NameInputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  hint?: string;
  /** Use larger padding (py-3 px-4 instead of py-2 px-3) */
  size?: "default" | "large";
}

// Pattern for valid Ukrainian name characters:
// - Basic Cyrillic А-Я (U+0410-U+042F), а-я (U+0430-U+044F)
// - Ukrainian specific: Ґ (U+0490), ґ (U+0491), Є (U+0404), є (U+0454), І (U+0406), і (U+0456), Ї (U+0407), ї (U+0457)
// - Apostrophe variants (', ʼ, ')
// - Hyphen for compound names
// - Space
const CYRILLIC_NAME_PATTERN = /^[\u0410-\u044F\u0404\u0406\u0407\u0454\u0456\u0457\u0490\u0491\s\-'ʼ']*$/;

// Pattern to detect Latin characters
const LATIN_PATTERN = /[A-Za-z]/;

/**
 * Validates if the input contains only valid Ukrainian name characters
 */
function validateUkrainianName(value: string): { isValid: boolean; error?: string } {
  if (!value) {
    return { isValid: true };
  }

  // Check for Latin characters first (more specific error)
  if (LATIN_PATTERN.test(value)) {
    return { 
      isValid: false, 
      error: "Використовуйте українську розкладку" 
    };
  }

  // Check for other invalid characters
  if (!CYRILLIC_NAME_PATTERN.test(value)) {
    return { 
      isValid: false, 
      error: "Тільки українські літери" 
    };
  }

  return { isValid: true };
}

export function NameInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  error: externalError,
  autoComplete,
  disabled,
  className,
  hint,
  size = "default",
}: NameInputProps) {
  const [validationError, setValidationError] = useState<string | undefined>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Validate
    const { isValid, error } = validateUkrainianName(newValue);
    
    if (!isValid) {
      setValidationError(error);
    } else {
      setValidationError(undefined);
    }
    
    // Always update the value (let user see what they typed)
    onChange(newValue);
  }, [onChange]);

  // External error takes priority, then validation error
  const displayError = externalError || validationError;

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={name} 
          className={`block text-sm font-medium mb-1.5 ${
            size === "large" ? "text-[var(--sky-fg)]" : "text-[var(--sky-fg-muted)]"
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        data-form-type="other"
        data-lpignore="true"
        className={`w-full border bg-[var(--sky-bg)] text-sm text-[var(--sky-fg)] placeholder-[var(--sky-fg-muted)] transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
          size === "large"
            ? "px-4 py-3 focus:ring-2 focus:ring-[var(--sky-accent)]/50"
            : "px-3 py-2 focus:border-[var(--sky-accent)]"
        } ${displayError ? "border-red-500" : "border-[var(--sky-border)]"}`}
        style={{ borderRadius: size === "large" ? 4 : 2 }}
      />
      {displayError && <p className="mt-1 text-xs text-red-500">{displayError}</p>}
      {hint && !displayError && <p className="mt-1 text-xs text-[var(--sky-fg-muted)]">{hint}</p>}
    </div>
  );
}

/**
 * Utility function to check if a name is valid (for form submission validation)
 */
export function isValidUkrainianName(value: string): boolean {
  if (!value) return true; // Empty is valid (use required prop for that)
  return CYRILLIC_NAME_PATTERN.test(value) && !LATIN_PATTERN.test(value);
}

