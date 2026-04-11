import type { CafePresetName } from '../lib/meeting'
import {
  PAUL_BASSETT_CAFE_NAME,
  STARBUCKS_CAFE_NAME,
} from '../lib/meeting'

type Props = { name: CafePresetName; size?: number }

function LatelierLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2b1200"/>
      {/* Cup saucer */}
      <ellipse cx="50" cy="72" rx="24" ry="5" fill="#c49a5a" opacity="0.5"/>
      {/* Cup body */}
      <path d="M30 42 Q28 68 50 70 Q72 68 70 42 Z" fill="#e8c89a"/>
      {/* Cup rim */}
      <rect x="27" y="38" width="46" height="7" rx="3.5" fill="#c49a5a"/>
      {/* Handle */}
      <path d="M70 46 Q82 46 82 55 Q82 64 70 64" stroke="#c49a5a" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Coffee surface */}
      <ellipse cx="50" cy="41" rx="19" ry="3" fill="#6b3a1f" opacity="0.6"/>
      {/* Steam 1 */}
      <path d="M38 34 Q35 27 38 20 Q41 13 38 6" stroke="#c49a5a" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* Steam 2 */}
      <path d="M50 32 Q47 25 50 18 Q53 11 50 4" stroke="#c49a5a" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* Steam 3 */}
      <path d="M62 34 Q59 27 62 20 Q65 13 62 6" stroke="#c49a5a" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* L'a text */}
      <text x="50" y="62" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fontWeight="700" fill="#2b1200" letterSpacing="1">L'a</text>
    </svg>
  )
}

export function CafeLogoIcon({ name, size = 48 }: Props) {
  if (name === STARBUCKS_CAFE_NAME) {
    return (
      <img
        src="/logos/starbucks.svg"
        alt="스타벅스"
        width={size}
        height={size}
        style={{ display: 'block', borderRadius: '50%' }}
      />
    )
  }

  if (name === PAUL_BASSETT_CAFE_NAME) {
    return (
      <img
        src="/logos/paul-bassett.svg"
        alt="폴 바셋"
        width={size}
        height={size}
        style={{ display: 'block', borderRadius: '50%' }}
      />
    )
  }

  return <LatelierLogo size={size} />
}
