import clsx from 'clsx';

// Small form building blocks shared by the admin onboarding forms. They match the look of
// ui/Input so a form mixing them stays consistent.

const FIELD_CLASS =
  'w-full rounded-xl border border-slate-600/20 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';

export function FieldLabel({ htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5 text-sm font-medium text-charcoal">
      {children}
      {hint && <span className="ml-1 font-normal text-slate-600">({hint})</span>}
    </label>
  );
}

export function FieldError({ children }) {
  return children ? <p className="mt-1 text-xs text-error">{children}</p> : null;
}

export function Select({ id, label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <select id={id} className={clsx(FIELD_CLASS, error && 'border-error', className)} {...props}>
        {children}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextArea({ id, label, hint, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
      )}
      <textarea id={id} className={clsx(FIELD_CLASS, 'resize-y', error && 'border-error', className)} {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

// Toggleable pill used for multi-select options (specialties, modes, accreditations).
export function ChoiceChip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
        selected ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-slate-600/20 bg-white text-slate-600 hover:border-teal-300'
      )}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-teal-600" />
      <span>
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        {description && <span className="block text-xs text-slate-600">{description}</span>}
      </span>
    </label>
  );
}

export function FormSection({ title, children }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</legend>
      {children}
    </fieldset>
  );
}

// Turns "MBBS, MD Pediatrics" into ['MBBS', 'MD Pediatrics'].
export const splitList = (text) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Maps API validation details ({ path: 'body.fee.video', message }) to { 'fee.video': message }.
export function fieldErrorsFrom(err) {
  const details = err?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.map((d) => [d.path.replace(/^body\./, ''), d.message]));
}
