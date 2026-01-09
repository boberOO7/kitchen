"use client";

import { useRef, useState, useLayoutEffect } from "react";

interface PhoneInputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  autoCompleteSection?: string;
  disabled?: boolean;
  className?: string;
  hint?: string;
  /** Use larger padding (py-3 px-4 instead of py-2 px-3) */
  size?: "default" | "large";
}

// Map digit count to cursor position in formatted string "+380 (XX) XXX XX XX"
// Format positions: +380 (XX) XXX XX XX
//                   012345678901234567890
//                             1111111111
function getCursorPosition(digitCount: number): number {
  // After N digits, cursor should be at:
  // 0 → 6  (after "(")
  // 1 → 7  (after first digit)
  // 2 → 10 (after ") ", before 3rd digit)
  // 3 → 11
  // 4 → 12
  // 5 → 14 (after " ", before 6th digit)
  // 6 → 15
  // 7 → 17 (after " ", before 8th digit)
  // 8 → 18
  // 9 → 19 (end)
  const positions = [6, 7, 10, 11, 12, 14, 15, 17, 18, 19];
  return positions[Math.min(digitCount, 9)];
}

export function PhoneInput({ 
  label, 
  name, 
  value, 
  onChange, 
  required, 
  error, 
  autoCompleteSection,
  disabled,
  className,
  hint,
  size = "default",
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Extract only digits after +380
  const digits = value.replace(/\D/g, "").replace(/^380/, "").replace(/^0/, "").slice(0, 9);
  
  // Calculate cursor position based on digit count
  const cursorPos = getCursorPosition(digits.length);
  
  // Use useLayoutEffect to set cursor position synchronously before paint
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && isFocused && document.activeElement === input) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
  }, [cursorPos, digits, isFocused]);

  // Process any phone number format into our format (for autocomplete)
  const processPhoneNumber = (input: string): string => {
    // Remove all non-digits
    let allDigits = input.replace(/\D/g, "");
    
    // Handle various formats:
    // +380XXXXXXXXX -> XXXXXXXXX
    // 380XXXXXXXXX -> XXXXXXXXX
    // 0XXXXXXXXX -> XXXXXXXXX
    if (allDigits.startsWith("380")) {
      allDigits = allDigits.slice(3);
    }
    if (allDigits.startsWith("0")) {
      allDigits = allDigits.slice(1);
    }
    
    // Limit to first 9 digits
    return allDigits.slice(0, 9);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const inputValue = e.target.value;
    const newDigits = processPhoneNumber(inputValue);
    
    // If nothing changed, skip update
    if (newDigits === digits) {
      return;
    }
    
    onChange(newDigits ? `+380${newDigits}` : "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    // Allow backspace to work properly
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits.length > 0) {
        const newDigits = digits.slice(0, -1);
        onChange(newDigits ? `+380${newDigits}` : "");
      }
    }
    
    // Prevent cursor from moving with arrow keys
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    const input = inputRef.current;
    if (input) {
      requestAnimationFrame(() => {
        input.setSelectionRange(cursorPos, cursorPos);
      });
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = () => {
    if (disabled) return;
    const input = inputRef.current;
    if (input) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
  };

  // Build display with mask: digits shown, rest as underscores
  const d = digits.padEnd(9, "_");
  const displayValue = `+380 (${d[0]}${d[1]}) ${d[2]}${d[3]}${d[4]} ${d[5]}${d[6]} ${d[7]}${d[8]}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={`block text-sm font-medium mb-1.5 ${
          size === "large" ? "text-[var(--sky-fg)]" : "text-[var(--sky-fg-muted)]"
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="tel"
          id={name}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          required={required}
          disabled={disabled}
          autoComplete={autoCompleteSection ? `${autoCompleteSection} tel` : "tel"}
          className={`w-full border bg-[var(--sky-bg)] text-sm font-mono tracking-wide text-[var(--sky-fg)] transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
            size === "large" 
              ? "px-4 py-3 focus:ring-2 focus:ring-[var(--sky-accent)]/50" 
              : "px-3 py-2 focus:border-[var(--sky-accent)]"
          } ${error ? "border-red-500" : "border-[var(--sky-border)]"}`}
          style={{ borderRadius: size === "large" ? 4 : 2, caretColor: "var(--sky-fg)" }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[var(--sky-fg-muted)]">{hint}</p>}
    </div>
  );
}

