import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  htmlFor,
  className,
  children,
}) => {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint && !error ? `${fieldId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)} data-field-describedby={describedBy}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-danger-500 ml-0.5" aria-hidden>*</span>}
          {required && <span className="sr-only"> ({t('form.requiredField')})</span>}
        </label>
      )}
      {React.Children.map(children, (child) => {
        if (React.isValidElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>(child)) {
          return React.cloneElement(child, {
            id: child.props.id ?? fieldId,
            'aria-describedby': child.props['aria-describedby'] ?? describedBy,
            'aria-invalid': child.props['aria-invalid'] ?? !!error,
          });
        }
        return child;
      })}
      {error && <p id={errorId} className="text-xs text-danger-600 mt-1" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
};

/* ---------- Input ---------- */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full h-9 px-3 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 border rounded-lg transition-colors duration-150 min-h-[44px] sm:min-h-0',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          hasError
            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
            : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900',
          'disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

/* ---------- Textarea ---------- */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 border rounded-lg resize-y min-h-[80px] transition-colors duration-150',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          hasError
            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
            : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900',
          'disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

/* ---------- Select ---------- */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, hasError, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full h-9 px-3 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 border rounded-lg appearance-none transition-colors duration-150 min-h-[44px] sm:min-h-0',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8',
          hasError
            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
            : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900',
          'disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);
Select.displayName = 'Select';

/* ---------- Checkbox ---------- */

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2 min-h-[44px] sm:min-h-0">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(
            'h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-0 transition-colors',
            className,
          )}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer select-none py-2 sm:py-0">
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
