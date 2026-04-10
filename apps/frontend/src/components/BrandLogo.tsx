type BrandLogoProps = {
  size?: 'compact' | 'default' | 'hero'
}

export function BrandLogo({ size = 'default' }: BrandLogoProps) {
  return (
    <div className={`brand-lockup ${size}`} aria-label="에콩커피">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 120 120" role="img">
          <defs>
            <linearGradient id="cupBody" x1="20%" x2="80%" y1="12%" y2="100%">
              <stop offset="0%" stopColor="#fff6df" />
              <stop offset="100%" stopColor="#f2ddb2" />
            </linearGradient>
            <linearGradient id="beanFill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#c98b5e" />
              <stop offset="100%" stopColor="#8e5432" />
            </linearGradient>
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#6f4328" floodOpacity="0.22" />
            </filter>
          </defs>

          <g filter="url(#softShadow)">
            <path
              d="M36 35h40c6 0 11 5 11 11v31c0 12-10 21-22 21H47c-12 0-22-9-22-21V46c0-6 5-11 11-11Z"
              fill="url(#cupBody)"
            />
            <path
              d="M84 47h8c10 0 18 8 18 18s-8 18-18 18h-8"
              fill="none"
              stroke="#f4e5bd"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx="56" cy="35" rx="32" ry="8" fill="#fff2d5" />
            <ellipse cx="56" cy="36.5" rx="29" ry="6.5" fill="#6f4328" />

            <g transform="translate(59 20) rotate(12)">
              <ellipse cx="0" cy="0" rx="12" ry="17" fill="url(#beanFill)" />
              <path
                d="M-1 -13c5 7 6 19 1 27"
                fill="none"
                stroke="#6d3f25"
                strokeLinecap="round"
                strokeWidth="3.2"
              />
            </g>

            <circle cx="44" cy="60" r="4" fill="#8b5737" />
            <circle cx="64" cy="60" r="4" fill="#8b5737" />
            <path
              d="M45 73c5 7 13 7 18 0"
              fill="none"
              stroke="#8b5737"
              strokeLinecap="round"
              strokeWidth="4.5"
            />
          </g>

          <path
            d="M25 43c3-6 10-7 13-1-4 1-6 5-6 8-4 0-7-2-7-7Z"
            fill="#f6a8a5"
          />
          <path
            d="M81 26c3-6 10-7 13-1-4 1-6 5-6 8-4 0-7-2-7-7Z"
            fill="#f6a8a5"
          />
          <path
            d="M92 40c4-7 13-8 17-1-5 1-8 6-8 10-5 0-9-3-9-9Z"
            fill="#f39c9c"
          />
        </svg>
      </div>
      <div className="brand-copy">
        <strong>에콩커피</strong>
        <span>커피 주문 취합</span>
      </div>
    </div>
  )
}
