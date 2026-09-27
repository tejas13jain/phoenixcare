import { PhoenixIcon } from './PhoenixIcon.jsx';

export function PhoenixLogoLockup({ size = 40, showTagline = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PhoenixIcon size={size} />
      <div className="leading-tight">
        <div className="font-heading font-bold text-charcoal" style={{ fontSize: size * 0.62 }}>
          Phoenix<span className="text-teal-500">Care</span>
        </div>
        {showTagline && (
          <div className="font-body text-slate-600" style={{ fontSize: size * 0.24 }}>
            Rise stronger, every day.
          </div>
        )}
      </div>
    </div>
  );
}
