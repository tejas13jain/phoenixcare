import { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(function Input({ label, error, className = '', id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-1.5 text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={clsx(
          'w-full rounded-xl border px-4 py-2.5 text-sm bg-white transition-shadow',
          'focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500',
          error ? 'border-error' : 'border-slate-600/20',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
});
