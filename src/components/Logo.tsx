interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label="ArchFlow Logo"
    >
      {/* Circular background with gradient */}
      <defs>
        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <clipPath id="circleClip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      {/* Main circle */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#circleGradient)"
      />

      {/* Layered waves clipped to circle */}
      <g clipPath="url(#circleClip)">
        {/* Bottom wave - lightest */}
        <path
          d="M0 75 Q25 65, 50 75 T100 75 L100 100 L0 100 Z"
          fill="rgba(255, 255, 255, 0.2)"
        />

        {/* Middle wave */}
        <path
          d="M0 60 Q25 50, 50 60 T100 60 L100 100 L0 100 Z"
          fill="rgba(255, 255, 255, 0.35)"
        />

        {/* Top wave - brightest */}
        <path
          d="M0 48 Q25 38, 50 48 T100 48 L100 100 L0 100 Z"
          fill="rgba(255, 255, 255, 0.5)"
        />
      </g>

      {/* Subtle inner shadow for depth */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="rgba(0, 0, 0, 0.1)"
        strokeWidth="1"
      />
    </svg>
  );
}
