interface MikromatterLogoProps {
  className?: string;
  showText?: boolean;
}

export function MikromatterLogo({ className = "", showText = true }: MikromatterLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        
        {/* Upper circle of the 8 */}
        <ellipse
          cx="16"
          cy="12"
          rx="12"
          ry="9"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Lower circle of the 8 */}
        <ellipse
          cx="16"
          cy="28"
          rx="12"
          ry="9"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Center intersection highlight */}
        <circle
          cx="16"
          cy="20"
          r="2"
          fill="url(#logoGradient)"
        />
      </svg>
      
      {showText && (
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Mikromatter
        </h1>
      )}
    </div>
  );
}
