type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`brand-lockup ${compact ? 'compact' : ''}`} aria-label="에콩커피">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <defs>
            <linearGradient id="brandMarkFill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#d58a4a" />
              <stop offset="100%" stopColor="#8f4f22" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#brandMarkFill)" />
          <path
            d="M18 16h10a6 6 0 0 1 0 12H18z"
            fill="none"
            stroke="#fffaf3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M29 19h3a4 4 0 0 1 0 8h-3"
            fill="none"
            stroke="#fffaf3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M19 33h14"
            fill="none"
            stroke="#fffaf3"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M21 12c0 2 1.5 2.8 1.5 4.6"
            fill="none"
            stroke="#fffaf3"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
          <path
            d="M26 11c0 2 1.5 2.8 1.5 4.6"
            fill="none"
            stroke="#fffaf3"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
      </div>
      <div className="brand-copy">
        <strong>에콩커피</strong>
        {!compact ? <span>미팅 커피 취합</span> : null}
      </div>
    </div>
  )
}
