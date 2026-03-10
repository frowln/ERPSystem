import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'is_filled'
  | 'is_empty'
  | 'gt'
  | 'lt';

export interface FieldCondition {
  /** Name of the form field to watch */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Expected value(s) — not required for is_filled / is_empty */
  value?: unknown;
}

export interface ConditionalFieldProps {
  /** One or more conditions that control visibility */
  conditions: FieldCondition[];
  /** How to combine multiple conditions (default: 'and') */
  logic?: 'and' | 'or';
  /** react-hook-form `watch` function */
  watch: (fieldName: string) => unknown;
  children: React.ReactNode;
  /** Enable smooth height transition (default: true) */
  animate?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Condition evaluation helpers
// ---------------------------------------------------------------------------

function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function evaluateCondition(actual: unknown, condition: FieldCondition): boolean {
  const { operator, value } = condition;

  switch (operator) {
    case 'equals':
      return actual === value;
    case 'not_equals':
      return actual !== value;
    case 'in':
      return Array.isArray(value) ? value.includes(actual) : false;
    case 'not_in':
      return Array.isArray(value) ? !value.includes(actual) : true;
    case 'is_filled':
      return isFilled(actual);
    case 'is_empty':
      return !isFilled(actual);
    case 'gt':
      return typeof actual === 'number' && typeof value === 'number' ? actual > value : false;
    case 'lt':
      return typeof actual === 'number' && typeof value === 'number' ? actual < value : false;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  conditions,
  logic = 'and',
  watch,
  children,
  animate = true,
  className,
}) => {
  const visible = useMemo(() => {
    const results = conditions.map((c) => {
      const actual = watch(c.field);
      return evaluateCondition(actual, c);
    });
    return logic === 'and' ? results.every(Boolean) : results.some(Boolean);
  }, [conditions, logic, watch]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(visible ? 'auto' : 0);
  const [shouldRender, setShouldRender] = useState(visible);
  const prevVisible = useRef(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!animate) {
      setHeight(visible ? 'auto' : 0);
      if (!visible) setShouldRender(false);
      return;
    }

    const el = contentRef.current;
    if (!el) return;

    if (visible && !prevVisible.current) {
      // Expanding
      setHeight(0);
      requestAnimationFrame(() => {
        setHeight(el.scrollHeight);
        const timer = setTimeout(() => setHeight('auto'), 200);
        return () => clearTimeout(timer);
      });
    } else if (!visible && prevVisible.current) {
      // Collapsing
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => {
        setHeight(0);
      });
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }

    prevVisible.current = visible;
  }, [visible, animate]);

  if (!shouldRender && !visible) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        animate && 'overflow-hidden transition-[height,opacity] duration-200 ease-in-out',
        !visible && animate && 'opacity-0',
        visible && animate && 'opacity-100',
        className,
      )}
      style={animate ? { height: height === 'auto' ? undefined : height } : undefined}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
};

ConditionalField.displayName = 'ConditionalField';
