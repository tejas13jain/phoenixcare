import clsx from 'clsx';

const VARIANTS = {
  teal: 'bg-teal-50 text-teal-700',
  sunrise: 'bg-sunrise-50 text-sunrise-600',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-slate-600/10 text-slate-600',
};

export function Badge({ children, variant = 'neutral', className = '', ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
