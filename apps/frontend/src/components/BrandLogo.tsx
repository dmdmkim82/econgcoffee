type BrandLogoProps = {
  size?: 'compact' | 'default' | 'hero'
}

export function BrandLogo({ size = 'default' }: BrandLogoProps) {
  return (
    <div className={`brand-lockup ${size}`} aria-label="에콩커피">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 120 120" role="img">
          <defs>
            <radialGradient id="cloudGlow" cx="50%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#fff7eb" />
              <stop offset="60%" stopColor="#ffd8b7" />
              <stop offset="100%" stopColor="#f0a274" />
            </radialGradient>
            <linearGradient id="beanFill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#ffdcb2" />
              <stop offset="100%" stopColor="#c9834b" />
            </linearGradient>
            <linearGradient id="cupFill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#ffcf9f" />
              <stop offset="100%" stopColor="#ef955a" />
            </linearGradient>
          </defs>

          <g opacity="0.96">
            <circle cx="34" cy="34" r="5" fill="#ffc39d" />
            <circle cx="88" cy="28" r="6" fill="#ffb38f" />
            <circle cx="96" cy="56" r="4" fill="#ffceb0" />
            <circle cx="23" cy="62" r="4.5" fill="#ffcfac" />
            <path
              d="M100 33c5 0 9 4 9 8s-4 8-9 8c-4 0-8-2-10-6 0-5 4-10 10-10Z"
              fill="#ff8e8e"
            />
            <path
              d="M18 31c4-5 10-6 15-2-4 1-7 5-8 9-4-1-6-3-7-7Z"
              fill="#ffd18f"
            />
            <path
              d="M91 15c3 2 5 5 5 8-3 1-6 0-8-2 0-3 1-5 3-6Z"
              fill="#ffd18f"
            />
          </g>

          <g>
            <path
              d="M40 88c-14 0-25-10-25-23 0-10 6-18 15-21 1-16 14-29 31-29 15 0 27 10 31 24 11 1 20 10 20 22 0 15-12 27-28 27Z"
              fill="url(#cloudGlow)"
            />
            <path
              d="M49 17c8-6 19-5 26 0 6 4 10 11 10 19-8 7-18 11-30 11-12 0-22-4-30-11 0-8 4-15 10-19Z"
              fill="#fff5e5"
              opacity="0.7"
            />
          </g>

          <g>
            <ellipse cx="59" cy="53" rx="5.4" ry="5.7" fill="#7d3d23" />
            <ellipse cx="81" cy="53" rx="5.4" ry="5.7" fill="#7d3d23" />
            <ellipse cx="49" cy="65" rx="9" ry="7.4" fill="#ff8d6d" opacity="0.9" />
            <ellipse cx="91" cy="65" rx="9" ry="7.4" fill="#ff8d6d" opacity="0.9" />
            <path
              d="M64 73c4 4 11 4 15 0"
              fill="none"
              stroke="#8c4729"
              strokeLinecap="round"
              strokeWidth="3.4"
            />
          </g>

          <g transform="translate(60 12) rotate(8)">
            <ellipse cx="0" cy="0" rx="13" ry="18" fill="url(#beanFill)" />
            <path
              d="M-1 -14c6 8 7 22 1 31"
              fill="none"
              stroke="#8d4c28"
              strokeLinecap="round"
              strokeWidth="3.5"
            />
          </g>

          <g transform="translate(52 74)">
            <ellipse cx="18" cy="26" rx="24" ry="8" fill="#e79f74" opacity="0.22" />
            <path
              d="M3 10c0-6 5-11 11-11h12c6 0 11 5 11 11v16c0 5-4 9-9 9H12c-5 0-9-4-9-9Z"
              fill="url(#cupFill)"
            />
            <path
              d="M37 11h4c5 0 9 4 9 9s-4 9-9 9h-4"
              fill="none"
              stroke="#c77746"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              d="M13 14c2 2 4 3 6 3 3 0 4-1 6-3"
              fill="none"
              stroke="#8c4729"
              strokeLinecap="round"
              strokeWidth="2.4"
            />
            <circle cx="16" cy="10" r="2.2" fill="#8c4729" />
            <circle cx="25" cy="10" r="2.2" fill="#8c4729" />
            <path
              d="M19 -8c0-5 4-8 4-12"
              fill="none"
              stroke="#ffb37a"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d="M28 -8c0-5 4-8 4-12"
              fill="none"
              stroke="#ffb37a"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d="M37 5c2 2 3 4 3 7"
              fill="none"
              stroke="#ffc08c"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
          </g>
        </svg>
      </div>
      <div className="brand-copy">
        <strong>에콩커피</strong>
        <span>커피 주문 취합</span>
      </div>
    </div>
  )
}
