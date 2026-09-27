// Icon-only phoenix mark: a rising wing/flame silhouette whose lower contour doubles as a
// heartbeat/pulse line. Used standalone (app icon, favicon, splash) and inside PhoenixLogoLockup.
export function PhoenixIcon({ size = 40, animated = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="PhoenixCare icon"
    >
      <defs>
        <linearGradient id="phoenixGradIcon" x1="10%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#0F6E6A" />
          <stop offset="55%" stopColor="#2C8FEA" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
      <path
        d="M100,172 C58,172 28,140 28,100 C28,58 54,32 70,12 C67,44 84,56 90,40 C95,62 111,56 116,29 C132,54 152,70 152,106 C152,146 136,172 100,172 Z"
        fill="url(#phoenixGradIcon)"
        className={animated ? 'animate-rise-wing' : ''}
      />
      <path
        d="M8,100 L58,100 L74,68 L90,134 L106,56 L122,100 L192,100"
        fill="none"
        stroke="#F7FAFA"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
