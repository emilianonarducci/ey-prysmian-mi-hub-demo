interface PrysmianLogoProps {
  variant?: "full" | "mark";
  className?: string;
  height?: number;
}

export default function PrysmianLogo({ variant = "full", className = "", height = 32 }: PrysmianLogoProps) {
  if (variant === "mark") {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Prysmian"
      >
        <defs>
          <linearGradient id="prysmianGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00875A" />
            <stop offset="100%" stopColor="#00B589" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="url(#prysmianGradient)" />
        <path
          d="M 14 14 Q 20 20 26 14 Q 20 14 14 20 Q 20 26 26 20 Q 20 20 14 26"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={height}
        height={height}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Prysmian"
      >
        <defs>
          <linearGradient id="prysmianGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00875A" />
            <stop offset="100%" stopColor="#00B589" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="url(#prysmianGradientFull)" />
        <path
          d="M 14 14 Q 20 20 26 14 Q 20 14 14 20 Q 20 26 26 20 Q 20 20 14 26"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-semibold tracking-tight text-white text-lg lowercase">prysmian</span>
    </div>
  );
}
