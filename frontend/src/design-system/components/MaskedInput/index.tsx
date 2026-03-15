import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  validateINN,
  validateKPP,
  validateSNILS,
  validateOGRN,
  validateRussianPhone,
} from '@/lib/russianValidation';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type MaskType = 'inn-legal' | 'inn-individual' | 'kpp' | 'snils' | 'ogrn' | 'phone' | 'custom';

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  /** Pattern for custom mask: 9 = digit, A = letter, * = any */
  customMask?: string;
  onChange?: (value: string, formatted: string) => void;
  onValidate?: (result: { valid: boolean; error?: string }) => void;
  showValidation?: boolean;
  hasError?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mask definitions                                                  */
/* ------------------------------------------------------------------ */

interface MaskDef {
  pattern: string; // '_' = digit placeholder, 'A' = alphanumeric
  maxRaw: number;
  digitOnly: boolean;
  validate: (raw: string) => { valid: boolean; error?: string };
}

const MASK_DEFS: Record<Exclude<MaskType, 'custom'>, MaskDef> = {
  'inn-legal': {
    pattern: '__________', // 10 digits
    maxRaw: 10,
    digitOnly: true,
    validate: (v) => (v.length === 0 ? { valid: true } : validateINN(v)),
  },
  'inn-individual': {
    pattern: '____________', // 12 digits
    maxRaw: 12,
    digitOnly: true,
    validate: (v) => (v.length === 0 ? { valid: true } : validateINN(v)),
  },
  kpp: {
    pattern: '_________', // 9 chars (digits + possible letters in 5-6)
    maxRaw: 9,
    digitOnly: false,
    validate: (v) => (v.length === 0 ? { valid: true } : validateKPP(v)),
  },
  snils: {
    pattern: '___-___-___ __',
    maxRaw: 11,
    digitOnly: true,
    validate: (v) => (v.length === 0 ? { valid: true } : validateSNILS(v)),
  },
  ogrn: {
    pattern: '_____________', // 13 digits
    maxRaw: 13,
    digitOnly: true,
    validate: (v) => (v.length === 0 ? { valid: true } : validateOGRN(v)),
  },
  phone: {
    pattern: '+7 (___) ___-__-__',
    maxRaw: 10,
    digitOnly: true,
    validate: (v) => (v.length === 0 ? { valid: true } : validateRussianPhone(v)),
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function stripNonDigits(s: string): string {
  return s.replace(/\D/g, '');
}

function stripNonAlphanumeric(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '');
}

/** Apply mask pattern to raw input. Returns formatted string. */
function applyMask(raw: string, pattern: string, digitOnly: boolean): string {
  let ri = 0;
  let result = '';
  for (let pi = 0; pi < pattern.length && ri < raw.length; pi++) {
    const pc = pattern[pi];
    if (pc === '_' || pc === 'A') {
      result += raw[ri];
      ri++;
    } else {
      result += pc;
    }
  }
  return result;
}

/** Extract raw chars from a formatted string according to the mask pattern. */
function extractRaw(formatted: string, pattern: string, digitOnly: boolean): string {
  let raw = '';
  for (let i = 0; i < formatted.length && i < pattern.length; i++) {
    const pc = pattern[i];
    if (pc === '_' || pc === 'A') {
      const ch = formatted[i];
      if (ch !== undefined) raw += ch;
    }
  }
  return raw;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      mask,
      customMask,
      onChange,
      onValidate,
      showValidation = false,
      hasError: hasErrorProp,
      className,
      value: controlledValue,
      defaultValue,
      ...rest
    },
    ref,
  ) => {
    const def: MaskDef | null =
      mask === 'custom'
        ? customMask
          ? {
              pattern: customMask,
              maxRaw: customMask.replace(/[^_9A*]/g, '').length,
              digitOnly: !customMask.includes('A') && !customMask.includes('*'),
              validate: () => ({ valid: true }),
            }
          : null
        : MASK_DEFS[mask];

    const pattern = def?.pattern ?? '';
    const maxRaw = def?.maxRaw ?? 999;
    const digitOnly = def?.digitOnly ?? true;

    const strip = digitOnly ? stripNonDigits : stripNonAlphanumeric;

    // Phone prefix handling
    const isPhone = mask === 'phone';

    const toFormatted = useCallback(
      (raw: string) => applyMask(raw, pattern, digitOnly),
      [pattern, digitOnly],
    );

    const initialRaw = controlledValue
      ? strip(String(controlledValue))
      : defaultValue
        ? strip(String(defaultValue))
        : '';

    const [raw, setRaw] = useState(initialRaw);
    const [formatted, setFormatted] = useState(() => toFormatted(initialRaw));
    const [validationResult, setValidationResult] = useState<{
      valid: boolean;
      error?: string;
    } | null>(null);
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Sync if controlled value changes externally
    useEffect(() => {
      if (controlledValue !== undefined) {
        const newRaw = strip(String(controlledValue)).substring(0, maxRaw);
        if (newRaw !== raw) {
          setRaw(newRaw);
          setFormatted(toFormatted(newRaw));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controlledValue]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        // For phone, strip the fixed "+7 " prefix before parsing
        if (isPhone) {
          // Remove everything that is part of the prefix
          input = input.replace(/^\+?7?\s*\(?\s*/, '');
        }

        let newRaw = strip(input).substring(0, maxRaw);

        // For phone, also strip leading 7 or 8 if user pastes full number
        if (isPhone && newRaw.length > 10) {
          const first = newRaw[0];
          if (first === '7' || first === '8') {
            newRaw = newRaw.substring(1);
          }
          newRaw = newRaw.substring(0, maxRaw);
        }

        const newFormatted = toFormatted(newRaw);
        setRaw(newRaw);
        setFormatted(newFormatted);
        onChange?.(newRaw, newFormatted);

        // Clear validation on type
        if (validationResult) {
          setValidationResult(null);
        }
      },
      [maxRaw, strip, toFormatted, onChange, isPhone, validationResult],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setTouched(true);
        if (def && raw.length > 0) {
          const result = def.validate(raw);
          setValidationResult(result);
          onValidate?.(result);
        } else {
          setValidationResult(null);
        }
        rest.onBlur?.(e);
      },
      [def, raw, onValidate, rest],
    );

    const showIcon = showValidation && touched && validationResult !== null && raw.length > 0;
    const isValid = validationResult?.valid ?? false;
    const errorMsg = validationResult?.error;

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            type="text"
            inputMode={digitOnly ? 'numeric' : 'text'}
            value={formatted}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'w-full h-9 px-3 text-sm bg-white dark:bg-neutral-700 dark:text-neutral-100 border rounded-lg transition-colors duration-150 min-h-[44px] sm:min-h-0',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              hasErrorProp || (showIcon && !isValid)
                ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
                : showIcon && isValid
                  ? 'border-green-400 dark:border-green-600 focus:border-green-500 focus:ring-green-100'
                  : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900',
              'disabled:bg-neutral-50 dark:disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed',
              showIcon && 'pr-9',
              className,
            )}
            {...rest}
          />
          {showIcon && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-danger-500" />
              )}
            </span>
          )}
        </div>
        {showValidation && touched && errorMsg && (
          <p className="text-xs text-danger-600 mt-1">{errorMsg}</p>
        )}
      </div>
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
