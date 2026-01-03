import * as React from "react";

/**
 * Custom hook for OTP input business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. INPUT MANAGEMENT:
 *    - Manages refs for each input field to enable programmatic focus control
 *    - Supports configurable OTP length (default: 6 digits)
 *    - Filters non-numeric characters to ensure only digits are entered
 * 
 * 2. CHARACTER INPUT:
 *    - Single character: Updates value at specific index and auto-advances to next field
 *    - Paste handling: Accepts multi-character paste, filters digits, truncates to length
 *    - Auto-focus: Moves focus to next field after input or to last field after paste
 * 
 * 3. KEYBOARD NAVIGATION:
 *    - Backspace: Moves to previous field when current field is empty (smart deletion)
 *    - Arrow keys: Navigate between fields for better UX
 *    - Prevents invalid input through numeric-only filtering
 * 
 * 4. PASTE OPTIMIZATION:
 *    - Strips non-numeric characters from pasted content
 *    - Truncates to OTP length to prevent overflow
 *    - Focuses appropriate field based on pasted content length
 */
export function useOtpInput(
  length: number,
  value: string,
  onChange: (value: string) => void
) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Handle input change (single char or paste)
  const handleChange = React.useCallback(
    (index: number, inputValue: string) => {
      // Handle paste (multi-character input)
      if (inputValue.length > 1) {
        const pastedValue = inputValue.slice(0, length);
        onChange(pastedValue);
        // Focus last filled input or last input
        const focusIndex = Math.min(pastedValue.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
        return;
      }

      // Handle single character input
      const newValue = value.split("");
      newValue[index] = inputValue;
      const joined = newValue.join("").slice(0, length);
      onChange(joined);

      // Auto-advance to next field
      if (inputValue && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [length, value, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (index: number, e: React.KeyboardEvent) => {
      // Smart backspace: move to previous field if current is empty
      if (e.key === "Backspace" && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Arrow key navigation
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [length, value]
  );

  // Handle paste event
  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      // Extract and sanitize pasted data (digits only)
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
      onChange(pastedData.slice(0, length));
      // Focus appropriate field based on pasted length
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    },
    [length, onChange]
  );

  // Sanitize input value (digits only)
  const sanitizeInput = React.useCallback((input: string) => {
    return input.replace(/\D/g, "");
  }, []);

  return {
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
    sanitizeInput,
  };
}

