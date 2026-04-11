import type { CafePresetName } from '../lib/meeting'
import {
  PAUL_BASSETT_CAFE_NAME,
  STARBUCKS_CAFE_NAME,
} from '../lib/meeting'

type Props = { name: CafePresetName; size?: number }

function LatelierLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="24" cy="24" r="24" fill="#3d1f0a" />
      {/* Cup body */}
      <path
        d="M15 20h18l-2.4 12H17.4L15 20z"
        fill="#e8c89a"
        stroke="#c49a5a"
        strokeWidth="0.5"
      />
      {/* Cup rim */}
      <rect x="13.5" y="18" width="21" height="3" rx="1.5" fill="#c49a5a" />
      {/* Handle */}
      <path
        d="M33 23c2.5 0 4 1.5 4 3.5S35.5 30 33 30"
        stroke="#c49a5a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Steam lines */}
      <path d="M19 15c0-1 1-2 1-3" stroke="#c49a5a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 14c0-1 1-2 1-3" stroke="#c49a5a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M29 15c0-1 1-2 1-3" stroke="#c49a5a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Saucer */}
      <ellipse cx="24" cy="33.5" rx="9" ry="1.5" fill="#c49a5a" opacity="0.6" />
    </svg>
  )
}

function StarbucksLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="24" cy="24" r="24" fill="#1E3932" />
      {/* Outer ring */}
      <circle cx="24" cy="24" r="19" stroke="#D4E9E2" strokeWidth="1.5" fill="none" />
      {/* Inner siren body */}
      <circle cx="24" cy="22" r="8" fill="#D4E9E2" />
      {/* Siren face */}
      <ellipse cx="24" cy="21" rx="5" ry="5.5" fill="#1E3932" />
      {/* Crown / star points */}
      <path d="M24 12 L25.5 16 L24 15.5 L22.5 16Z" fill="#D4E9E2" />
      <path d="M30 14.5 L29 18.5 L27.5 17Z" fill="#D4E9E2" />
      <path d="M18 14.5 L19 18.5 L20.5 17Z" fill="#D4E9E2" />
      {/* Tail / skirt */}
      <path
        d="M16 26c0 0 2 5 8 5s8-5 8-5"
        stroke="#D4E9E2"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Arms / fins */}
      <path d="M14 24 Q10 27 11 31" stroke="#D4E9E2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M34 24 Q38 27 37 31" stroke="#D4E9E2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="22" cy="20" r="0.8" fill="#D4E9E2" />
      <circle cx="26" cy="20" r="0.8" fill="#D4E9E2" />
    </svg>
  )
}

function PaulBassettLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="24" cy="24" r="24" fill="#1a1a1a" />
      {/* Outer ring */}
      <circle cx="24" cy="24" r="19" stroke="#c8a96e" strokeWidth="1" fill="none" />
      {/* Coffee bean shape */}
      <ellipse cx="24" cy="24" rx="10" ry="13" fill="#c8a96e" />
      {/* Bean crease */}
      <path
        d="M24 12 Q18 24 24 36"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* PB text */}
      <text
        x="24"
        y="27"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fontFamily="Georgia, serif"
        fill="#1a1a1a"
        letterSpacing="0.5"
      >
        PB
      </text>
    </svg>
  )
}

export function CafeLogoIcon({ name, size = 48 }: Props) {
  if (name === STARBUCKS_CAFE_NAME) return <StarbucksLogo size={size} />
  if (name === PAUL_BASSETT_CAFE_NAME) return <PaulBassettLogo size={size} />
  return <LatelierLogo size={size} />
}
