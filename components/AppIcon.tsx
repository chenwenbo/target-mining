interface AppIconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ size = 32, className }: AppIconProps) {
  const id = `ai-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: Math.round(size * 0.22) }}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="30%" cy="70%" r="75%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#2D2B8F" />
        </radialGradient>
        <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect width="120" height="120" />
        </clipPath>
      </defs>

      <rect width="120" height="120" fill={`url(#${id}-bg)`} />

      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="30" cy="90" r="22" fill="none" stroke="#6C63FF" strokeWidth="0.8" strokeOpacity="0.28" />
        <circle cx="30" cy="90" r="40" fill="none" stroke="#6C63FF" strokeWidth="0.8" strokeOpacity="0.22" />
        <circle cx="30" cy="90" r="58" fill="none" stroke="#6C63FF" strokeWidth="0.8" strokeOpacity="0.16" />
        <circle cx="30" cy="90" r="76" fill="none" stroke="#6C63FF" strokeWidth="0.6" strokeOpacity="0.1" />

        <path d="M30 90 L102 22" stroke="#6C63FF" strokeWidth="1.4" strokeOpacity="0.95" />
        <path d="M30 90 L102 22 A96 96 0 0 0 30 90Z" fill={`url(#${id}-sweep)`} opacity="0.2" />

        <line x1="30" y1="82" x2="30" y2="98" stroke="#6C63FF" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="22" y1="90" x2="38" y2="90" stroke="#6C63FF" strokeWidth="0.7" strokeOpacity="0.5" />

        <circle cx="68" cy="52" r="3.5" fill="#6C63FF" opacity="0.95" />
        <circle cx="68" cy="52" r="6.5" fill="none" stroke="#6C63FF" strokeWidth="0.9" opacity="0.5" />
        <circle cx="68" cy="52" r="11" fill="none" stroke="#6C63FF" strokeWidth="0.5" opacity="0.22" />

        <circle cx="52" cy="70" r="2" fill="#A89FFF" opacity="0.7" />
      </g>

      <circle cx="30" cy="90" r="3" fill="#6C63FF" />
      <circle cx="30" cy="90" r="5.5" fill="none" stroke="#6C63FF" strokeWidth="0.9" opacity="0.5" />
    </svg>
  );
}
