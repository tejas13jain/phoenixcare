import { motion } from 'framer-motion';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-phoenix-gradient text-white shadow-soft hover:brightness-105',
  secondary: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
  outline: 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50',
  ghost: 'text-slate-600 hover:bg-slate-600/10',
  danger: 'bg-error text-white hover:brightness-105',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-heading font-semibold transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />
      )}
      {children}
    </motion.button>
  );
}
